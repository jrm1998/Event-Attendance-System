(function () {
  'use strict';

  /**
   * Small fetch wrapper. Adds CSRF (via csrf-helper) and unwraps JSON errors.
   */
  window.api = async function api(url, options) {
    options = options || {};
    var init = {
      method: options.method || 'GET',
      credentials: 'same-origin',
      headers: options.headers || {},
    };
    if (options.formData) {
      init.method = options.method || 'POST';
      init.body = options.formData;
    } else if (options.body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }
    var res = await fetch(url, init);
    var data = null;
    try {
      data = await res.json();
    } catch (e) {
      /* non-JSON response */
    }
    if (!res.ok) {
      var err = new Error((data && data.error) || 'Request failed (' + res.status + ')');
      err.status = res.status;
      err.details = data && data.details;
      throw err;
    }
    return data;
  };

  window.showToast = function showToast(message, type) {
    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container position-fixed bottom-0 start-50 translate-middle-x p-3';
      container.style.zIndex = '3000';
      document.body.appendChild(container);
    }
    var el = document.createElement('div');
    el.className = 'toast align-items-center text-bg-' + (type || 'primary');
    el.setAttribute('role', 'alert');
    el.innerHTML = '<div class="d-flex"><div class="toast-body">' + message + '</div>' +
      '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>';
    container.appendChild(el);
    var toast = new bootstrap.Toast(el, { delay: 4000 });
    toast.show();
    el.addEventListener('hidden.bs.toast', function () { el.remove(); });
  };

  window.confirmDialog = async function confirmDialog(message) {
    return window.confirm(message);
  };
})();
