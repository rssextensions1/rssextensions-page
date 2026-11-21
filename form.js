// Consultation form: friendly validation, photo previews, and photo shrinking
// so large phone pictures upload quickly and stay under the email size limit.
(function () {
  var form = document.getElementById('consult-form');
  if (!form) return;
  var errorBox = document.getElementById('error-box');
  var submitBtn = document.getElementById('submit-btn');
  var MAX_SIDE = 1600;      // longest side of uploaded photos, in pixels
  var QUALITY = 0.82;       // JPEG quality

  // Pre-fill today's date.
  var today = document.getElementById('today');
  if (today && !today.value) {
    var d = new Date();
    today.value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Show a thumbnail when a photo is chosen.
  form.querySelectorAll('input[type=file]').forEach(function (input) {
    input.addEventListener('change', function () {
      var box = input.parentNode.querySelector('.previews');
      if (!box) return;
      box.innerHTML = '';
      Array.prototype.forEach.call(input.files, function (f) {
        if (!f.type || f.type.indexOf('image/') !== 0) return;
        var img = document.createElement('img');
        img.alt = '';
        img.src = URL.createObjectURL(f);
        box.appendChild(img);
      });
      input.classList.remove('field-error');
    });
  });

  form.addEventListener('input', function (e) { e.target.classList && e.target.classList.remove('field-error'); });
  form.addEventListener('change', function (e) { e.target.classList && e.target.classList.remove('field-error'); });

  function labelFor(el) {
    var fs = el.closest('fieldset');
    var lab = (el.id && form.querySelector('label[for="' + el.id + '"]')) || (fs && fs.querySelector('legend, .q'));
    var text = el.getAttribute('aria-label') || el.placeholder || (lab && lab.textContent) || el.name;
    return text.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  }

  function shrink(file) {
    return new Promise(function (resolve) {
      if (!file || !file.type || file.type.indexOf('image/') !== 0 || file.type === 'image/gif') return resolve(file);
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        if (scale === 1 && file.size < 1.5 * 1024 * 1024) { URL.revokeObjectURL(url); return resolve(file); }
        var c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * scale);
        c.height = Math.round(img.naturalHeight * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (blob) {
          if (!blob) return resolve(file);
          var name = (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg';
          resolve(new File([blob], name, { type: 'image/jpeg' }));
        }, 'image/jpeg', QUALITY);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  function shrinkAll() {
    var jobs = [];
    form.querySelectorAll('input[type=file]').forEach(function (input) {
      if (!input.files || !input.files.length || typeof DataTransfer === 'undefined') return;
      jobs.push(Promise.all(Array.prototype.map.call(input.files, shrink)).then(function (files) {
        try {
          var dt = new DataTransfer();
          files.forEach(function (f) { dt.items.add(f); });
          input.files = dt.files;
        } catch (e) { /* keep the original files */ }
      }));
    });
    return Promise.all(jobs);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.classList.remove('show');

    // Collect every field that still needs an answer.
    var missing = [];
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      if (el.type === 'hidden' || el.classList.contains('honey')) return;
      var bad = false;
      if (el.required && el.type === 'checkbox') bad = !el.checked;
      else if (el.required && el.type === 'file') bad = !el.files || !el.files.length;
      else if (el.required) bad = !String(el.value).trim();
      if (!bad && el.value && !el.checkValidity()) bad = true; // e.g. badly formatted email
      el.classList.toggle('field-error', bad);
      if (bad) missing.push(el);
    });

    if (missing.length) {
      var names = missing.slice(0, 6).map(labelFor);
      errorBox.innerHTML = '<strong>Almost there!</strong> Please complete ' + (missing.length === 1 ? 'this field' : 'these ' + missing.length + ' fields') + ':<br>• ' +
        names.map(function (n) { return n.replace(/[<>&]/g, ''); }).join('<br>• ') + (missing.length > 6 ? '<br>…and ' + (missing.length - 6) + ' more (outlined in red).' : '');
      errorBox.classList.add('show');
      errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Where to go after a successful send.
    document.getElementById('next-url').value = new URL('thank-you.html', window.location.href).href;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending… please wait';
    shrinkAll().then(function () {
      // Don't send empty photo slots.
      form.querySelectorAll('input[type=file]').forEach(function (i) { if (!i.files || !i.files.length) i.disabled = true; });
      HTMLFormElement.prototype.submit.call(form);
    }, function () {
      HTMLFormElement.prototype.submit.call(form);
    });
  });
})();
