/**
 * Ici on gère l'UI des réservations (mise à jour/suppression AJAX).
 * @module public/reservations
 */

(() => {
  const table = document.querySelector('[data-reservations-table]');
  const emptyState = document.querySelector('[data-reservations-empty]');
  const updateForms = document.querySelectorAll('[data-reservation-update]');
  const deleteForms = document.querySelectorAll('[data-reservation-delete]');

  if (!updateForms.length && !deleteForms.length) {
    return;
  }

  /**
   * Ça met la date au format YYYY-MM-DD.
   * @param {string | Date} value
   * @returns {string}
   */
  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().slice(0, 10);
  };

  /**
   * Ça supprime une ligne de réservation et bascule l'état vide.
   * @param {string} reservationId
   */
  const removeRow = (reservationId) => {
    const row = document.querySelector(`[data-reservation-row="${reservationId}"]`);
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
   * On branche le comportement de suppression à un formulaire réservation.
   * @param {HTMLFormElement} form
   */
  const handleDelete = (form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const reservationId = form.dataset.reservationId;
      if (!reservationId) {
        form.submit();
        return;
      }

      const confirmed = window.confirm(
        'Supprimer cette réservation ? Cette action est définitive.'
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
            if (data && data.errors && data.errors.length) {
              message = data.errors[0].message || message;
            }
          } catch (error) {
            // ignore JSON parsing errors
          }
          window.alert(message);
          return;
        }

        removeRow(reservationId);
      } catch (error) {
        window.alert('Erreur réseau pendant la suppression.');
      }
    });
  };

  /**
   * On branche le comportement de mise à jour à un formulaire réservation.
   * @param {HTMLFormElement} form
   */
  const handleUpdate = (form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const reservationId = form.dataset.reservationId;
      if (!reservationId) {
        form.submit();
        return;
      }

      const clientName = form.querySelector('input[name="clientName"]');
      const boatName = form.querySelector('input[name="boatName"]');
      const startDate = form.querySelector('input[name="startDate"]');
      const endDate = form.querySelector('input[name="endDate"]');

      const payload = new URLSearchParams();
      if (clientName && clientName.value.trim()) {
        payload.set('clientName', clientName.value.trim());
      }
      if (boatName && boatName.value.trim()) {
        payload.set('boatName', boatName.value.trim());
      }
      if (startDate && startDate.value) {
        payload.set('startDate', startDate.value);
      }
      if (endDate && endDate.value) {
        payload.set('endDate', endDate.value);
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
          body: payload
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
        const safeStart = formatDate(updated.startDate);
        const safeEnd = formatDate(updated.endDate);

        const cellClient = document.querySelector(
          `[data-reservation-client="${reservationId}"]`
        );
        const cellBoat = document.querySelector(
          `[data-reservation-boat="${reservationId}"]`
        );
        const cellStart = document.querySelector(
          `[data-reservation-start="${reservationId}"]`
        );
        const cellEnd = document.querySelector(
          `[data-reservation-end="${reservationId}"]`
        );

        if (cellClient) {
          cellClient.textContent = updated.clientName || '';
        }
        if (cellBoat) {
          cellBoat.textContent = updated.boatName || '';
        }
        if (cellStart) {
          cellStart.textContent = safeStart;
        }
        if (cellEnd) {
          cellEnd.textContent = safeEnd;
        }

        if (clientName && updated.clientName) {
          clientName.value = updated.clientName;
        }
        if (boatName && updated.boatName) {
          boatName.value = updated.boatName;
        }
        if (startDate && safeStart) {
          startDate.value = safeStart;
        }
        if (endDate && safeEnd) {
          endDate.value = safeEnd;
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

  updateForms.forEach((form) => {
    handleUpdate(form);
  });

  deleteForms.forEach((form) => {
    handleDelete(form);
  });
})();

