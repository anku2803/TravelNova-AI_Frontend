function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function renderDetail() {
  const id = Number(getQueryParam('id')) || 1;
  const ev = EVENTS.find(x => x.id === id);
  const root = document.getElementById('detailRoot');
  if (!ev) { root.innerHTML = '<p>Event not found.</p>'; return; }
  root.innerHTML = `
    <div class="title"><h1 class="font-color">${ev.title}</h1><div class="line"></div></div>
    <div class="row">
      <div class="col" style="flex:1">
        <img src="${ev.image}" style="width:100%;border-radius:8px;" />
      </div>
      <div class="col" style="flex:1;padding:1rem;">
        <h3>${ev.title}</h3>
        <p>${ev.details}</p>
        <p><strong>Contact:</strong> meankush2803@gmail.com</p>
        <a href="add.html" class="ctn">Book / Enquire</a>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', renderDetail);
