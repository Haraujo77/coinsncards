export function createToast(el = document.querySelector('#toast')) {
  let t = null;
  return (msg, ms = 1800) => {
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => {
      el.style.display = 'none';
    }, ms);
  };
}

