/**
 * Ici on gère l'UI des catways (CRUD AJAX).
 * @module public/catways
 */

(() => {
  const table = document.querySelector('[data-catways-table]');
  const emptyState = document.querySelector('[data-catways-empty]');
  const createForm = document.querySelector('[data-catway-create]');
  const deleteForms = document.querySelectorAll('[data-catway-delete]');
  const updateForms = document.querySelectorAll('[data-catway-update]');

  if (!createForm && !deleteForms.length && !updateForms.length) {
    return;
  }

  /**
   * Ça supprime une ligne de catway du tableau et bascule l'état vide.
   * @param {string} catwayNumber
   */
  const removeRow = (catwayNumber) => {
    const row = document.querySelector(`[data-catway-row="${catwayNumber}"]`);
    if (row) {
      row.remove();
    }

    if (table && table.querySelectorAll('tbody tr').length === 0) {
      table.setAttribute('hidden', '');
      if (emptyState) {
        emptyState.removeAttribute('hidden');
      }
    }
  };

  /**
   * On branche le comportement de suppression à un formulaire catway.
   * @param {HTMLFormElement} form
   */
  const deleteFormsObserver = (form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const catwayNumber = form.dataset.catwayNumber;
      if (!catwayNumber) {
        form.submit();
        return;
      }

      const confirmed = window.confirm(
        `Supprimer le catway ${catwayNumber} ? Cette action est définitive.`
      );
      if (!confirmed) {
        return;
      }

      try {
        const response = await fetch(form.action, {
          method: 'DELETE',
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json'
          }
        });

        if (!response.ok) {
          let message = 'Suppression impossible. Réessaie.';
          try {
            const data = await response.json();
            if (data && data.error) {
              message = data.error;
            }
          } catch (error) {
            // ignore JSON parsing errors
          }
          window.alert(message);
          return;
        }

        removeRow(catwayNumber);
      } catch (error) {
        window.alert('Erreur réseau pendant la suppression.');
      }
    });
  };

  /**
   * On branche le comportement de mise à jour à un formulaire catway.
   * @param {HTMLFormElement} form
   */
  const updateFormsObserver = (form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const catwayNumber = form.dataset.catwayNumber;
      const stateInput = form.querySelector('input[name="catwayState"]');
      const nextState = stateInput ? stateInput.value.trim() : '';

      if (!catwayNumber || !stateInput) {
        form.submit();
        return;
      }

      if (!nextState) {
        window.alert("L'état du catway est requis.");
        stateInput.focus();
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
      }

      try {
        const response = await fetch(form.action, {
          method: 'PUT',
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({ catwayState: nextState })
        });

        if (!response.ok) {
          let message = 'Mise à jour impossible. Réessaie.';
          try {
            const data = await response.json();
            if (data && data.error) {
              message = data.error;
            }
            if (data && data.errors && data.errors.length) {
              message = data.errors[0].message || message;
            }
          } catch (error) {
            // ignore JSON parsing errors
          }
          window.alert(message);
          return;
        }

        const updated = await response.json();
        const stateCell = document.querySelector(
          `[data-catway-state="${catwayNumber}"]`
        );
        if (stateCell && updated && updated.catwayState) {
          stateCell.textContent = updated.catwayState;
        }
        if (updated && updated.catwayState) {
          stateInput.value = updated.catwayState;
        }
      } catch (error) {
        window.alert('Erreur réseau pendant la mise à jour.');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });
  };

  /**
   * On ajoute une nouvelle ligne au tableau des catways.
   * @param {{catwayNumber: number, catwayType: string, catwayState: string}} catway
   */
  const addCatwayRow = (catway) => {
    if (!table) {
      return;
    }

    const tbody = table.querySelector('tbody');
    if (!tbody) {
      return;
    }

    if (emptyState) {
      emptyState.setAttribute('hidden', '');
    }
    table.removeAttribute('hidden');

    const row = document.createElement('tr');
    row.setAttribute('data-catway-row', catway.catwayNumber);
    row.innerHTML = `
      <td>${catway.catwayNumber}</td>
      <td>${catway.catwayType}</td>
      <td data-catway-state="${catway.catwayNumber}">${catway.catwayState}</td>
      <td>
        <form class="form form-inline" method="post" action="/catways/${catway.catwayNumber}" data-catway-update data-catway-number="${catway.catwayNumber}">
          <input type="hidden" name="_method" value="PUT">
          <input type="text" name="catwayState" value="${catway.catwayState}" required>
          <button type="submit">Enregistrer</button>
        </form>
      </td>
      <td>
        <form method="post" action="/catways/${catway.catwayNumber}" data-catway-delete data-catway-number="${catway.catwayNumber}">
          <input type="hidden" name="_method" value="DELETE">
          <button class="danger" type="submit">Supprimer</button>
        </form>
      </td>
    `;

    tbody.appendChild(row);

    const newUpdateForm = row.querySelector('[data-catway-update]');
    const newDeleteForm = row.querySelector('[data-catway-delete]');

    if (newUpdateForm) {
      updateFormsObserver(newUpdateForm);
    }
    if (newDeleteForm) {
      deleteFormsObserver(newDeleteForm);
    }
  };

  deleteForms.forEach((form) => {
    deleteFormsObserver(form);
  });

  updateForms.forEach((form) => {
    updateFormsObserver(form);
  });

  if (createForm) {
    createForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const numberInput = createForm.querySelector('input[name="catwayNumber"]');
      const typeSelect = createForm.querySelector('select[name="catwayType"]');
      const stateInput = createForm.querySelector('input[name="catwayState"]');

      if (!numberInput || !typeSelect || !stateInput) {
        createForm.submit();
        return;
      }

      const catwayNumber = numberInput.value.trim();
      const catwayType = typeSelect.value;
      const catwayState = stateInput.value.trim();

      if (!catwayNumber || !catwayState) {
        window.alert('Numéro et état requis.');
        return;
      }

      const submitButton = createForm.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
      }

      try {
        const response = await fetch(createForm.action, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            catwayNumber,
            catwayType,
            catwayState
          })
        });

        if (!response.ok) {
          let message = 'Création impossible. Réessaie.';
          try {
            const data = await response.json();
            if (data && data.error) {
              message = data.error;
            }
            if (data && data.errors && data.errors.length) {
              message = data.errors[0].message || message;
            }
          } catch (error) {
            // ignore JSON parsing errors
          }
          window.alert(message);
          return;
        }

        const created = await response.json();
        if (created && created.catwayNumber) {
          addCatwayRow(created);
        }

        numberInput.value = '';
        stateInput.value = '';
        typeSelect.value = 'short';
      } catch (error) {
        window.alert('Erreur réseau pendant la création.');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });
  }
})();

