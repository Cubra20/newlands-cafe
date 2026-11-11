/* NEWLAND'S CAFE: menu + ordering + stock + item photos. HTML/CSS/JS only. Data is saved in this browser (localStorage).
   Each function has a TASK (what it must do) and HOW (a beginner-friendly way to do it) comment for teammates. */

const KEY = 'newlands-v1';
const LOGO = 'images/logo.png.png';          // default picture for any item without its own photo (replace the file with the real logo)
const $ = s => document.querySelector(s);
const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); };   // add a listener only if this page has that element
const peso = n => '₱' + n.toLocaleString();
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// Categories in tab order, their add-ons [name, price] and (for hot drinks) the cup sizes.
// folder = the group folder inside images/ where that category's pictures live (change it to match your folder names).
const CATS = {
  hot:    {folder:'hot collections', label:'Hot',    sizes:['8oz','12oz'], add:[['Extra Espresso',40]]},
  iced:   {folder:'iced collections', label:'Iced',   add:[['Upsize',25],['Extra Espresso',40]]},
  frappe: {folder:'frappe collections', label:'Frappe', add:[['Upsize',25]]},
  fizz:   {folder:'fizz collections', label:'Fizz',   add:[['Upsize',10],['Sinkers',20]]},
  brewed: {folder:'brewed collections', label:'Brewed', add:[]},
  meals:  {folder:'meal collections', label:'Meals',  add:[['Extra Rice',25],['Extra Egg',20]]}
};
// Starting menu from the Newland's menu PDF: [name, price] or [name, 8oz price, 12oz price].
const MENU = {
  meals:[['Soy Garlic Chicken',159],['Breaded Porkchop',179],['Boneless Bangus',169],['Tocilog',149],['Hotsilog',139],['Longsilog',149],['Corned Beef Silog',149],['Fried Pork Belly',179],['Fried Pork Chop',179]],
  iced:[['Iced Americano',80],['Iced Spanish Latte',125],['Iced Matcha Latte',125],['Iced Vanilla Latte',125],['Iced Caramel Macchiato',125],['Iced Cappuccino',125],['Iced Strawberry Matcha',150],['Iced Mocha Latte',125],['Iced Hazelnut Latte',125],['Iced Salted Caramel Latte',125],['Iced Chocolate Latte',125]],
  frappe:[['Strawberry Frappe',150],['Blueberry Frappe',150],['Matcha Frappe',150],['Mocha Frappe',150],['Caramel / Salted Frappe',150],['Coffee Jelly Frappe',150],['Java Chip Frappe',150],['Cookies and Cream Frappe',150],['Green Apple Frappe',150]],
  fizz:[['Strawberry Fizz',120],['Blueberry Fizz',120],['Green Apple Fizz',120],['Mango Fizz',120],['Blue Curacao Fizz',120],['Lemon Fizz',120],['Passion Fruit Fizz',120],['Sparkling Americano Fizz',120]],
  hot:[['Latte',80,100],['Americano',60,80],['Matcha Latte',100,120],['Cappuccino',80,100],['Spanish Latte',100,120],['Chocolate Latte',100,120],['Caramel Macchiato',100,120],['Vanilla Latte',100,120],['Herbal Tea',50,70]],
  brewed:[['French Press',120],['Chemex Pour Over',150],['Siphon Brewer',200],['V60 Dripper',150]]
};

let S = load() || seed();   // S = the whole saved state: items, orders, msgs, counters
let cart = [];              // cart lines: {id, size, add:[add-on indexes], qty}
let curCat = 'hot';
let newFile = null, imgDir = null, pickFor = null, pending = null, tt;

/* TASK: Build the first menu with stock for every item.
   HOW: Loop over MENU, make one object per item with a unique id, 20 in stock and no photo (img ''). */
function seed() {
  let id = 1; const items = [];
  for (const c in MENU) MENU[c].forEach(([name, ...p]) => items.push({id: id++, cat: c, name, p, stock: 20, img: ''}));
  return {items, orders: [], msgs: [], nextId: id, nextOrder: 1};
}

/* TASK: Read and write the saved data.
   HOW: localStorage only stores text, so use JSON.stringify to save and JSON.parse to load. try/catch stops crashes if storage is blocked or full. */
function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save. The browser storage may be full.'); } }

/* TASK: Show a short message at the bottom (e.g. "Order placed").
   HOW: Put the text in #toast, show it, hide it after 2.5 seconds with setTimeout. */
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(tt); tt = setTimeout(() => t.style.display = 'none', 2500); }

const item = id => S.items.find(i => i.id === id);
const imgOf = i => !i.img ? LOGO : i.img.startsWith('data:') ? i.img : encodeURI(i.img);   // photo path of the item, or the shop logo
function noImg(im) { im.onerror = null; im.src = LOGO; im.classList.add('def'); }            // picture file not found: show the logo
const inCart = id => cart.filter(l => l.id === id).reduce((s, l) => s + l.qty, 0);

/* TASK: Keep My Order when the customer goes from one page to another.
   HOW: Every page reloads the script, so the cart is saved as text in localStorage (saveCart) and read back (loadCart); lines whose item was removed are dropped. */
const CART_KEY = 'newlands-cart';
function loadCart() { try { return (JSON.parse(localStorage.getItem(CART_KEY)) || []).filter(l => item(l.id)); } catch (e) { return []; } }
function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} }

/* TASK: Add the parts every page shares (the My Order drawer and the message box) so the HTML pages don't repeat them.
   HOW: insertAdjacentHTML adds this text as real HTML at the end of <body>. */
function mountShell() {
  document.body.insertAdjacentHTML('beforeend', `<div id="scrim" data-act="drawer"></div>
  <aside id="drawer" aria-label="My order"><div class="dh"><h3>My Order</h3><button class="ghost" data-act="drawer">Close</button></div><div id="cart"></div>
  <label for="cname">Name or table</label><input id="cname" maxlength="30" placeholder="Walk-in">
  <div class="total"><span>Total</span><span id="ctotal"></span></div><button class="pill dark wide" data-act="place">Place order</button></aside>
  <div id="toast" role="status"></div>`);
}

/* TASK: Compute the price of one cart line (base price for the size + chosen add-ons) and of the whole cart.
   HOW: Look up the item, take p[size], add the price of each chosen add-on. The cart total is the sum of unit price × qty. */
function unit(l) { const it = item(l.id); return it.p[l.size] + l.add.reduce((s, a) => s + CATS[it.cat].add[a][1], 0); }
const cartTotal = () => cart.reduce((s, l) => s + unit(l) * l.qty, 0);

/* TASK: Fill the three numbers on the Home hero.
   HOW: Count drinks (every category except meals), meals, and orders marked Served. */
function renderHero() {
  if (!$('#hstats')) return;   // only the Home page has this
  const drinks = S.items.filter(i => i.cat !== 'meals').length, meals = S.items.length - drinks;
  const served = S.orders.filter(o => o.status === 'Served').length;
  $('#hstats').innerHTML = `<div><b>${drinks}</b>Drinks on the menu</div><div><b>${meals}</b>Meals on the menu</div><div><b>${served}</b>Orders served</div>`;
}

/* TASK: Draw the category tabs and the photo cards of the chosen category.
   HOW: Build HTML with map().join(''), put it in the page with innerHTML. 5 or fewer in stock shows a badge; 0 disables the + button. */
function renderMenu() {
  if (!$('#items')) return;   // only the Menu page has this
  $('#tabs').innerHTML = Object.keys(CATS).map(c => `<button data-act="cat" data-v="${c}" class="${c === curCat ? 'on' : ''}">${CATS[c].label}</button>`).join('');
  $('#items').innerHTML = S.items.filter(i => i.cat === curCat).map(i => {
    const out = i.stock <= 0, left = i.stock - inCart(i.id);
    const tag = out ? 'Sold out' : i.stock <= 5 ? i.stock + ' left' : '';
    return `<article class="card ${out ? 'out' : ''}"><img src="${esc(imgOf(i))}" alt="${esc(i.name)}" class="${i.img ? '' : 'def'}" onerror="noImg(this)">
      ${tag ? `<span class="badge">${tag}</span>` : ''}
      <div class="glass"><small>${CATS[i.cat].label}</small><h4>${esc(i.name)}</h4><span>${i.p.map(peso).join(' / ')}</span>
      <button class="plus" data-act="add" data-id="${i.id}" aria-label="Add ${esc(i.name)}" ${left <= 0 ? 'disabled' : ''}>+</button></div></article>`;
  }).join('') || '<p class="note">No items in this category yet. Add one in Manage.</p>';
  const c = CATS[curCat];
  $('#catnote').textContent = (c.sizes ? 'Prices shown as 8oz / 12oz. ' : '') + (c.add.length ? 'Add-ons: ' + c.add.map(a => `${a[0]} +${peso(a[1])}`).join(', ') + '.' : '');
}

/* TASK: Ask for the size and add-ons before adding to the order.
   HOW: Fill the <dialog> with radio buttons (size) and checkboxes (add-ons), then showModal(). The dialog's "close" event (below) does the adding. */
function openAdd(id) {
  const it = item(id), c = CATS[it.cat]; pending = id;
  $('#dt').textContent = it.name;
  $('#db').innerHTML = (c.sizes ? '<label>Size</label>' + c.sizes.map((s, i) => `<label><input type="radio" name="sz" value="${i}" ${i === 0 ? 'checked' : ''}>${s} (${peso(it.p[i])})</label>`).join('') : '')
    + (c.add.length ? '<label>Add-ons</label>' + c.add.map((a, i) => `<label><input type="checkbox" name="ad" value="${i}">${a[0]} +${peso(a[1])}</label>`).join('') : '<p>No size or add-ons for this item.</p>');
  $('#dlg').showModal();
}
on('#dlg', 'close', () => {
  if ($('#dlg').returnValue !== 'ok' || pending == null) return;
  const sz = document.querySelector('input[name=sz]:checked');
  const add = [...document.querySelectorAll('input[name=ad]:checked')].map(x => +x.value);
  addToCart(pending, sz ? +sz.value : 0, add); pending = null;
});

/* TASK: Put the chosen item in the order without going over stock.
   HOW: Stop if inCart(id) already equals the stock. If the same item/size/add-ons are in the cart, raise qty; otherwise push a new line. */
function addToCart(id, size, add) {
  if (inCart(id) >= item(id).stock) return toast('No more stock for ' + item(id).name);
  const key = JSON.stringify([id, size, add]);
  const found = cart.find(l => JSON.stringify([l.id, l.size, l.add]) === key);
  found ? found.qty++ : cart.push({id, size, add, qty: 1});
  renderCart(); renderMenu(); toast(item(id).name + ' added to My Order');
}

/* TASK: Draw My Order: each line with options, quantity buttons, then the total and the number on the nav button.
   HOW: Loop over cart and build a row for each. data-i is the line's position so the +/− buttons know which line to change. */
function renderCart() {
  $('#cart').innerHTML = cart.map((l, i) => {
    const it = item(l.id), c = CATS[it.cat];
    const opts = [c.sizes ? c.sizes[l.size] : '', ...l.add.map(a => c.add[a][0])].filter(Boolean).join(', ');
    return `<div class="line"><div>${esc(it.name)}<small>${opts || 'Plain'} · ${peso(unit(l))}</small></div>
      <div class="qty"><button data-act="dec" data-i="${i}" aria-label="Fewer">−</button>${l.qty}<button data-act="inc" data-i="${i}" aria-label="More">+</button></div></div>`;
  }).join('') || '<p><small>Your order is empty. Pick something from the menu.</small></p>';
  $('#ctotal').textContent = peso(cartTotal());
  $('#count').textContent = cart.reduce((s, l) => s + l.qty, 0);
  saveCart();   // keep the order when you move to another page
}

/* TASK: Change a line's quantity (+ or −). Remove the line at 0.
   HOW: Change cart[i].qty by d. Block + when stock is reached. When qty hits 0, splice(i, 1) deletes the line. */
function changeQty(i, d) {
  const l = cart[i];
  if (d > 0 && inCart(l.id) >= item(l.id).stock) return toast('No more stock for ' + item(l.id).name);
  l.qty += d; if (l.qty <= 0) cart.splice(i, 1);
  renderCart(); renderMenu();
}

/* TASK: Confirm the order: re-check stock, subtract it, save the order, clear the cart.
   HOW: Check each item's stock first (stop with a message if short). Then lower item.stock, push an order holding a text copy of its lines, save(). */
function placeOrder() {
  if (!cart.length) return toast('Add something to your order first');
  for (const l of cart) if (inCart(l.id) > item(l.id).stock) return toast('Not enough stock for ' + item(l.id).name);
  const lines = cart.map(l => {
    const it = item(l.id), c = CATS[it.cat];
    return {text: `${l.qty} × ${it.name}` + [c.sizes ? c.sizes[l.size] : '', ...l.add.map(a => c.add[a][0])].filter(Boolean).map(x => ' · ' + x).join('')};
  });
  cart.forEach(l => item(l.id).stock -= l.qty);
  const no = S.nextOrder++;
  S.orders.unshift({no, name: $('#cname').value.trim() || 'Walk-in', lines, total: cartTotal(), status: 'Pending', time: new Date().toLocaleString()});
  cart = []; $('#cname').value = ''; save();
  renderCart(); renderMenu(); renderHero(); document.body.classList.remove('drawer-open');
  toast('Order #' + no + ' placed');
}

/* TASK: Manage page: numbers, orders (with status button), menu + stock table with photos, messages.
   HOW: Add up the order totals for sales. Each price/stock cell is an <input> with data-f; the "change" listener below saves it. */
function renderManage() {
  if (!$('#inv')) return;   // only the Manage page has this
  const sales = S.orders.reduce((s, o) => s + o.total, 0), pend = S.orders.filter(o => o.status === 'Pending').length;
  const low = S.items.filter(i => i.stock <= 5).length;
  $('#stats').innerHTML = `<div><b>${S.orders.length}</b>orders</div><div><b>${peso(sales)}</b>sales</div><div><b>${pend}</b>pending</div><div><b>${low}</b>low or sold out</div>`;
  $('#orders').innerHTML = S.orders.map(o => `<div class="order ${o.status === 'Served' ? 'done' : ''}"><div style="display:flex;justify-content:space-between;gap:1rem"><b>#${o.no} · ${esc(o.name)}</b><b>${peso(o.total)}</b></div>
    <small>${esc(o.time)}</small>${o.lines.map(l => `<div>${esc(l.text)}</div>`).join('')}
    <p style="margin:.6rem 0 0"><button class="ghost" data-act="status" data-no="${o.no}">${o.status === 'Pending' ? 'Mark as served' : 'Served (undo)'}</button></p></div>`).join('') || '<p>No orders yet.</p>';
  $('#inv').innerHTML = S.items.map(i => `<tr><td><img class="th ${i.img ? '' : 'def'}" src="${esc(imgOf(i))}" alt="" onerror="noImg(this)"></td><td>${esc(i.name)}</td><td>${CATS[i.cat].label}</td>
    <td><input type="number" min="1" data-f="price" data-id="${i.id}" value="${i.p[0]}" aria-label="Price of ${esc(i.name)}"></td>
    <td><input type="number" min="0" data-f="stock" data-id="${i.id}" value="${i.stock}" aria-label="Stock of ${esc(i.name)}"></td>
    <td><button class="ghost" data-act="photo" data-id="${i.id}">Photo</button>
    <button class="ghost" data-act="edit" data-id="${i.id}">Edit</button>
    <button class="ghost" data-act="del" data-id="${i.id}">Remove</button></td></tr>`).join('');
  $('#msgs').innerHTML = S.msgs.map(m => `<div class="order"><b>${esc(m.n)}</b> (${esc(m.e)})<br>${esc(m.m)}</div>`).join('') || '<p>No messages yet.</p>';
}

/* TASK: Edit stock or price from the table.
   HOW: Read the input value and store it on the item (hot drinks keep the same 8oz→12oz gap), save(), redraw. */
function editField(el) {
  const it = item(+el.dataset.id), v = Math.max(0, parseInt(el.value, 10) || 0);
  if (el.dataset.f === 'stock') it.stock = v;
  else if (v > 0) { const gap = it.p.length > 1 ? it.p[1] - it.p[0] : 0; it.p = it.p.length > 1 ? [v, v + gap] : [v]; }
  save(); renderManage(); renderMenu(); renderHero();
}

/* TASK: Link the pictures you already have in your computer's images folder to the menu items.
   HOW: A web page can't read your folders by itself, so you pick the "images" folder once. We list every picture inside it
   (images/<group folder>/<picture>), then matchImages() pairs each picture with the item whose name is closest. Only the path text is saved. */
const IMG = /\.(jpe?g|png|webp|gif|avif)$/i;
const norm = s => s.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]/g, '');   // "Iced Matcha.jpg" -> "icedmatcha"

// Ask for the images folder (Chrome/Edge). Kept until the page is reloaded; it also lets us SAVE new pictures there.
async function getRoot() {
  if (imgDir) return imgDir;
  const d = await showDirectoryPicker({mode: 'readwrite'});
  return imgDir = d.name.toLowerCase() === 'images' ? d : await d.getDirectoryHandle('images', {create: true});
}
// List every picture in a folder and its sub-folders: {rel: 'images/hot collections/latte.jpg', folder: 'hot collections', base: 'latte'}
async function walk(dir, path, out) {
  for await (const [name, h] of dir.entries()) {
    if (h.kind === 'directory') await walk(h, path + '/' + name, out);
    else if (IMG.test(name)) out.push({rel: path + '/' + name, folder: path.split('/').pop().toLowerCase(), base: norm(name)});
  }
}
async function linkFolder() {
  if (!window.showDirectoryPicker) return $('#dirpick').click();   // Firefox/Safari: read-only folder picker (see below)
  try { const out = []; await walk(await getRoot(), 'images', out); matchImages(out); }
  catch (e) { if (e.name !== 'AbortError') toast('Could not open that folder'); }
}
on('#dirpick', 'change', e => {
  const out = [...e.target.files].filter(f => IMG.test(f.name)).map(f => {
    const p = f.webkitRelativePath.split('/'), k = p.findIndex(x => x.toLowerCase() === 'images');
    return {rel: k >= 0 ? p.slice(k).join('/') : 'images/' + p.slice(1).join('/'), folder: (p[p.length - 2] || '').toLowerCase(), base: norm(f.name)};
  });
  e.target.value = ''; matchImages(out);
});

/* TASK: Pair each menu item with the picture whose file name is closest to the item name.
   HOW: Compare names using only letters and numbers, so "iced matcha.jpg" matches "Iced Matcha Latte". Exact name = 3 points,
   partial name (only inside the item's own group folder) = 2, +1 when the picture is in the group folder. The best score wins. */
function matchImages(list) {
  let n = 0;
  for (const it of S.items) {
    const nm = norm(it.name), key = it.cat.slice(0, 4); let best = null, bs = 0;
    for (const f of list) {
      const ok = f.folder.includes(key);
      const s0 = f.base === nm ? 3 : ok && f.base.length >= 4 && (nm.includes(f.base) || f.base.includes(nm)) ? 2 : 0;
      if (!s0) continue;
      const sc = s0 + (ok ? 1 : 0);
      if (sc > bs || (sc === bs && best && f.base.length > best.base.length)) { bs = sc; best = f; }
    }
    if (best) { it.img = best.rel; n++; }
  }
  save(); renderMenu(); renderManage();
  toast(`Linked ${n} of ${S.items.length} items to your pictures`);
}

/* TASK: Save a picture you chose into your computer's images folder, inside the item's group folder.
   HOW: With a linked folder (Chrome/Edge) the file is written to images/<group>/<item name>.<ext>. Other browsers can't write to disk,
   so the file is downloaded and you move it into that folder yourself. Returns the path text to remember. */
async function savePhoto(file, it) {
  const c = CATS[it.cat], ext = (file.name.match(/\.[a-z0-9]+$/i) || ['.jpg'])[0].toLowerCase();
  const fname = it.name.toLowerCase().replace(/[\\/:*?"<>|]/g, '') + ext;
  try {
    if (!window.showDirectoryPicker) throw 0;
    const dir = await (await getRoot()).getDirectoryHandle(c.folder, {create: true});
    const w = await (await dir.getFileHandle(fname, {create: true})).createWritable();
    await w.write(file); await w.close(); toast(`Saved to images/${c.folder}/${fname}`);
  } catch (e) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = fname; a.click();
    toast(`Downloaded ${fname}. Move it into images/${c.folder}/`);
  }
  return `images/${c.folder}/${fname}`;
}

/* TASK: "Add a menu item" modal: open it, preview the photo, save the new item.
   HOW: openNew() clears the form and shows the dialog. Choosing a photo fills newFile. On submit build the item, save the photo to disk
   with savePhoto() (empty = shop logo), push the item, save(), close. */
function openNew() { $('#addform').reset(); newFile = null; $('#pimg').src = LOGO; catChanged(); $('#ndlg').showModal(); }
function catChanged() {
  const c = CATS[$('#ac').value];
  $('#aplab').textContent = c.sizes ? 'Price (₱) for 8oz (12oz is ₱20 more)' : 'Price (₱)';
  $('#pathhint').textContent = `Saved on your computer in images/${c.folder}/. Leave empty to use the shop logo.`;
}
on('#ac', 'change', catChanged);
on('#pf', 'change', e => { newFile = e.target.files[0] || null; $('#pimg').src = newFile ? URL.createObjectURL(newFile) : LOGO; });
on('#addform', 'submit', async e => {
  e.preventDefault();
  const c = $('#ac').value, price = +$('#ap').value;
  const it = {id: S.nextId++, cat: c, name: $('#an').value.trim(), p: CATS[c].sizes ? [price, price + 20] : [price], stock: +$('#as').value, img: ''};
  if (newFile) it.img = await savePhoto(newFile, it);
  S.items.push(it); save(); $('#ndlg').close(); renderManage(); renderMenu(); renderHero();
  if (!newFile) toast('Menu item added');
});

/* TASK: Change the photo of an item already on the menu.
   HOW: The "Photo" button remembers the item id (pickFor) and clicks a hidden file input; when a file is chosen, savePhoto() it and store the path on the item. */
on('#rowpick', 'change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f || pickFor == null) return;
  const it = item(pickFor); it.img = await savePhoto(f, it); save(); renderManage(); renderMenu();
});

/* TASK: Save the Contact Us form so staff can read it in Manage.
   HOW: Push {n, e, m} into S.msgs, save(), clear the form and confirm with toast(). */
on('#cform', 'submit', e => {
  e.preventDefault();
  S.msgs.unshift({n: $('#cn').value, e: $('#ce').value, m: $('#cm').value});
  save(); e.target.reset(); toast('Message sent. Thank you!');
});

/* TASK: Make every button work from one place.
   HOW: Each button has data-act="name". Find the closest element with data-act, then run the matching function in this list. */
const acts = {
  cat: b => { curCat = b.dataset.v; renderMenu(); },
  add: b => openAdd(+b.dataset.id),
  inc: b => changeQty(+b.dataset.i, 1),
  dec: b => changeQty(+b.dataset.i, -1),
  place: placeOrder,
  drawer: () => document.body.classList.toggle('drawer-open'),
  full: b => { const t = $('#items'); t.classList.toggle('grid'); b.textContent = t.classList.contains('grid') ? 'Show less' : 'View Full Menu'; },
  prev: () => $('#items').scrollBy({left: -460, behavior: 'smooth'}),
  next: () => $('#items').scrollBy({left: 460, behavior: 'smooth'}),
  newitem: openNew,
  linkdir: linkFolder,
  closen: () => $('#ndlg').close(),
  photo: b => { pickFor = +b.dataset.id; $('#rowpick').click(); },
  status: b => { const o = S.orders.find(o => o.no === +b.dataset.no); o.status = o.status === 'Pending' ? 'Served' : 'Pending'; save(); renderManage(); renderHero(); },
  edit: b => { const it = item(+b.dataset.id); $('#an').value = it.name; $('#ac').value = it.cat; $('#ap').value = it.p[0]; $('#as').value = it.stock; newFile = null; $('#pimg').src = imgOf(it); catChanged(); pending = it.id; $('#edlg').showModal(); },
  del: b => { const it = item(+b.dataset.id); if (!confirm('Remove ' + it.name + ' from the menu?')) return; S.items = S.items.filter(i => i !== it); cart = cart.filter(l => l.id !== it.id); save(); renderManage(); renderMenu(); renderCart(); renderHero(); },
  reset: () => { if (!confirm('Delete all orders, messages, photos and stock changes?')) return; S = seed(); cart = []; save(); renderMenu(); renderCart(); renderHero(); renderManage(); toast('Data reset. Click Link my images folder to relink your pictures.'); }
};
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && acts[b.dataset.act]) acts[b.dataset.act](b); });
document.addEventListener('change', e => { if (e.target.dataset.f) editField(e.target); });

/* TASK: Start the page: add the shared parts, load the saved cart, and draw whatever this page has.
   HOW: Each render function quietly does nothing when its part is not on this page. The nav is see-through only on Home (data-page="home"). */
mountShell(); cart = loadCart();
if ($('#ac')) $('#ac').innerHTML = Object.keys(CATS).map(c => `<option value="${c}">${CATS[c].label}</option>`).join('');
renderMenu(); renderHero(); renderManage(); renderCart();
if (document.body.dataset.page === 'home') {
  const solidNav = () => $('#nav').classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', solidNav, {passive: true}); solidNav();
}