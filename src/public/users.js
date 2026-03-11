(() => {
  const table = document.querySelector('[data-users-table]');
  const emptyState = document.querySelector('[data-users-empty]');
  const updateForms = document.querySelectorAll('[data-user-update]');
  const deleteForms = document.querySelectorAll('[data-user-delete]');

  if (!updateForms.length && !deleteForms.length) {
    return;
  }

  const escapeValue = (value) => {
    if (window.CSS && typeof CSS.escape === 'function') {
      return CSS.escape(value);
    }
    return value.replace(/"/g, '\\"');
  };

  const findRow = (email) => {
    const safeEmail = escapeValue(email);
    return document.querySelector(`[data-user-row="${safeEmail}"]`);
  };

  const removeRow = (email) => {
    const row = findRow(email);
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

  const updateRowEmail = (row, previousEmail, nextEmail) => {
    row.setAttribute('data-user-row', nextEmail);

    const usernameCell = row.querySelector(`[data-user-username="${escapeValue(previousEmail)}"]`);
    if (usernameCell) {
      usernameCell.setAttribute('data-user-username', nextEmail);
    }

    const emailCell = row.querySelector(`[data-user-email="${escapeValue(previousEmail)}"]`);
    if (emailCell) {
      emailCell.setAttribute('data-user-email', nextEmail);
    }

    const updateForm = row.querySelector('[data-user-update]');
    const deleteForm = row.querySelector('[data-user-delete]');

    if (updateForm) {
      updateForm.dataset.userEmail = nextEmail;
      updateForm.action = `/users/${encodeURIComponent(nextEmail)}`;
    }
    if (deleteForm) {
      deleteForm.dataset.userEmail = nextEmail;
      deleteForm.action = `/users/${encodeURIComponent(nextEmail)}`;
    }
  };

  const handleDelete = (form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = form.dataset.userEmail;
      if (!email) {
        form.submit();
        return;
      }

      const confirmed = window.confirm(
        `Supprimer l'utilisateur ${email} ? Cette action est définitive.`
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

        removeRow(email);
      } catch (error) {
        window.alert('Erreur réseau pendant la suppression.');
      }
    });
  };

  const handleUpdate = (form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const currentEmail = form.dataset.userEmail;
      if (!currentEmail) {
        form.submit();
        return;
      }

      const usernameInput = form.querySelector('input[name="username"]');
      const emailInput = form.querySelector('input[name="email"]');
      const passwordInput = form.querySelector('input[name="password"]');

      const username = usernameInput ? usernameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (!username || !email) {
        window.alert("Nom d'utilisateur et e-mail requis.");
        return;
      }

      if (password && password.length < 8) {
        window.alert('Le mot de passe doit contenir au moins 8 caractères.');
        return;
      }

      const payload = new URLSearchParams({
        username,
        email
      });
      if (password) {
        payload.set('password', password);
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
        const row = findRow(currentEmail);
        if (row) {
          const usernameCell = row.querySelector(
            `[data-user-username="${escapeValue(currentEmail)}"]`
          );
          const emailCell = row.querySelector(
            `[data-user-email="${escapeValue(currentEmail)}"]`
          );

          if (usernameCell && updated.username) {
            usernameCell.textContent = updated.username;
          }
          if (emailCell && updated.email) {
            emailCell.textContent = updated.email;
          }

          if (updated.email && updated.email !== currentEmail) {
            updateRowEmail(row, currentEmail, updated.email);
          }
        }

        if (passwordInput) {
          passwordInput.value = '';
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
