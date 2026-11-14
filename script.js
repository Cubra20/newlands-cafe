/* NEWLAND'S CAFE: menu + ordering + stock + item photos. HTML/CSS/JS only. Data is saved in this browser (localStorage).
   Each function has a TASK (what it must do) and HOW (a beginner-friendly way to do it) comment for teammates. */

const KEY = 'newlands-v1';
const LOGO = 'images/logo.png';   // the shop logo: shown when an item's picture is not found
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
S.items.forEach(i => { if (i.img) i.img = i.img.startsWith('data:') ? '' : i.img.split('/').pop(); });   // older versions saved a path or photo: keep only a file name
let cart = [];              // cart lines: {id, size, add:[add-on indexes], qty}
let curCat = 'hot';
let pending = null, editId = null, curTab = 'orders', tt;

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
    return `<article class="card ${out ? 'out' : ''}"><img src="${esc(picList(i)[0])}" data-id="${i.id}" data-n="0" alt="${esc(i.name)}" onerror="nextPic(this)">
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
  $('#tc-orders').textContent = pend || ''; $('#tc-msgs').textContent = S.msgs.length || '';   // small number badges on the tabs
  $('#orders').innerHTML = S.orders.map(o => `<div class="order ${o.status === 'Served' ? 'done' : ''}"><div style="display:flex;justify-content:space-between;gap:1rem"><b>#${o.no} · ${esc(o.name)}</b><b>${peso(o.total)}</b></div>
    <small>${esc(o.time)}</small>${o.lines.map(l => `<div>${esc(l.text)}</div>`).join('')}
    <p style="margin:.6rem 0 0"><button class="ghost" data-act="status" data-no="${o.no}">${o.status === 'Pending' ? 'Mark as served' : 'Served (undo)'}</button></p></div>`).join('') || '<p>No orders yet.</p>';
  $('#inv').innerHTML = S.items.map(i => `<tr><td><img class="th" src="${esc(picList(i)[0])}" data-id="${i.id}" data-n="0" alt="" onerror="nextPic(this)"></td><td>${esc(i.name)}</td><td>${CATS[i.cat].label}</td>
    <td><input type="number" min="1" data-f="price" data-id="${i.id}" value="${i.p[0]}" aria-label="Price of ${esc(i.name)}"></td>
    <td><input type="number" min="0" data-f="stock" data-id="${i.id}" value="${i.stock}" aria-label="Stock of ${esc(i.name)}"></td>
    <td><button class="ghost" data-act="edit" data-id="${i.id}">Edit</button> <button class="ghost" data-act="del" data-id="${i.id}">Remove</button></td></tr>`).join('');
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

/* TASK: Find the picture of each menu item inside your images folder.
   HOW: Every category has a folder (CATS[...].folder), so a picture lives at images/<folder>/<item name>.jpg in lowercase,
   e.g. images/iced collections/iced matcha latte.jpg. picList() lists the paths to try, best guess first: the file name typed in Edit (if any),
   the full item name, then the name without a last word like latte/frappe/fizz ("iced matcha"). Each name is tried as .jpg, .png, .jpeg and .webp.
   The <img> calls nextPic() each time a file is not found; when nothing is found the shop logo is shown. */
const EXTS = ['jpg', 'png', 'jpeg', 'webp'];
function picList(it) {
  const dir = 'images/' + CATS[it.cat].folder + '/', full = it.name.toLowerCase().trim();
  const names = [...new Set([(it.img || '').trim(), full, full.replace(/ (latte|frappe|fizz)$/, '')].filter(Boolean))];
  return names.flatMap(n => (/\.[a-z0-9]{3,4}$/i.test(n) ? [n] : EXTS.map(x => n + '.' + x))).map(f => encodeURI(dir + f));
}
function nextPic(im) {
  const list = picList(item(+im.dataset.id)), n = +im.dataset.n + 1;
  if (n < list.length) { im.dataset.n = n; im.src = list[n]; }
  else { im.onerror = null; im.src = LOGO; im.classList.add('def'); }
}

/* TASK: "Add a menu item" / "Edit" modal: open it, preview the picture, save.
   HOW: editId is null when adding and the item's id when editing. openEdit() copies the item's values into the form fields.
   The "Picture file name" box is optional: empty = the item name is used. showPreview() tries the same names as the menu does. */
function showPreview() {
  const im = $('#pimg'), t = {name: $('#an').value, cat: $('#ac').value, img: $('#pf').value};
  if (!t.name.trim() && !t.img.trim()) { im.onerror = null; im.src = LOGO; return; }
  const list = picList(t); let n = 0;
  im.onerror = () => { n++; if (n < list.length) im.src = list[n]; else { im.onerror = null; im.src = LOGO; } };
  im.src = list[0];
}
function openNew() {
  editId = null; $('#addform').reset();
  $('#ntitle').textContent = 'Add a menu item'; $('#nsave').textContent = 'Save item';
  catChanged(); showPreview(); $('#ndlg').showModal();
}
function openEdit(id) {
  const it = item(id); editId = id; $('#addform').reset();
  $('#ntitle').textContent = 'Edit menu item'; $('#nsave').textContent = 'Save changes';
  $('#an').value = it.name; $('#ac').value = it.cat; $('#ap').value = it.p[0]; $('#as').value = it.stock; $('#pf').value = it.img || '';
  catChanged(); showPreview(); $('#ndlg').showModal();
}
function catChanged() {
  const c = CATS[$('#ac').value];
  $('#aplab').textContent = c.sizes ? 'Price (₱) for 8oz (12oz ' + (editId == null ? 'is ₱20 more)' : 'keeps its gap)') : 'Price (₱)';
  $('#pathhint').textContent = `Put the picture file in images/${c.folder}/. Leave this empty to use the item name (e.g. latte.jpg).`;
}
on('#ac', 'change', () => { catChanged(); showPreview(); });
on('#an', 'input', showPreview);
on('#pf', 'input', showPreview);

/* TASK: Save the modal: a NEW item, or the changes to the item being edited.
   HOW: When editing, copy the form values onto the existing item (it keeps its 8oz/12oz price gap); when adding, push a new item.
   The picture is not copied anywhere: only the file name is stored, and the page looks for it in the images folder. Then save(), close, redraw. */
on('#addform', 'submit', e => {
  e.preventDefault();
  const c = $('#ac').value, price = +$('#ap').value, name = $('#an').value.trim(), stock = +$('#as').value, img = $('#pf').value.trim();
  let it = editId == null ? null : item(editId), msg = 'Menu item added';
  if (it) {
    const gap = it.p.length > 1 ? it.p[1] - it.p[0] : 20;
    if (it.cat !== c) cart = cart.filter(l => l.id !== it.id);   // old size/add-on choices don't fit a new category
    Object.assign(it, {name, cat: c, stock, img, p: CATS[c].sizes ? [price, price + gap] : [price]}); msg = 'Item updated';
  } else { S.items.push({id: S.nextId++, cat: c, name, p: CATS[c].sizes ? [price, price + 20] : [price], stock, img}); }
  save(); $('#ndlg').close(); renderManage(); renderMenu(); renderHero(); renderCart(); toast(msg);
});

/* TASK: Show one Manage tab (Orders, Menu and Stocks, Messages) and hide the others.
   HOW: Give class "on" to the clicked tab button, then hide every .panel except the one whose id is "tab-<name>" using the hidden property. */
function showTab(t) {
  curTab = t;
  document.querySelectorAll('#mtabs button').forEach(b => b.classList.toggle('on', b.dataset.v === t));
  document.querySelectorAll('.panel').forEach(p => p.hidden = p.id !== 'tab-' + t);
}

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
  edit: b => openEdit(+b.dataset.id),
  tab: b => showTab(b.dataset.v),
  changepin: () => showGate('create'),
  gcancel: () => openManage(),
  lock: () => { setUnlocked(false); location.reload(); },
  closen: () => $('#ndlg').close(),
  status: b => { const o = S.orders.find(o => o.no === +b.dataset.no); o.status = o.status === 'Pending' ? 'Served' : 'Pending'; save(); renderManage(); renderHero(); },
  del: b => { const it = item(+b.dataset.id); if (!confirm('Remove ' + it.name + ' from the menu?')) return; S.items = S.items.filter(i => i !== it); cart = cart.filter(l => l.id !== it.id); save(); renderManage(); renderMenu(); renderCart(); renderHero(); },
  reset: () => { if (!confirm('Delete all orders, messages, photos and stock changes?')) return; S = seed(); cart = []; save(); renderMenu(); renderCart(); renderHero(); renderManage(); toast('Data reset'); }
};
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && acts[b.dataset.act]) acts[b.dataset.act](b); });
document.addEventListener('change', e => { if (e.target.dataset.f) editField(e.target); });

/* TASK: Ask for a PIN before the Manage page opens.
   HOW: The Manage content starts hidden and a PIN form (#gate) is shown. The first time there is no PIN yet, so the form asks the staff to CREATE one
   (4 to 6 digits, typed twice). After that it asks for the PIN. We save only a scrambled version (hashPin), never the PIN itself.
   Once the right PIN is typed, sessionStorage remembers it for this browser tab only; leaving Manage (or pressing Lock) asks again.
   NOTE: this is simple protection for a school project. A web page with no server cannot keep a PIN truly secret. */
const PIN_KEY = 'newlands-pin', UNLOCK = 'newlands-unlocked';
let gateMode = '', fails = 0, lockUntil = 0;
function hashPin(p) { let h = 5381; for (const ch of 'newlands:' + p) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0; return String(h); }
function getPin() { try { return localStorage.getItem(PIN_KEY); } catch (e) { return null; } }
function setUnlocked(yes) { try { yes ? sessionStorage.setItem(UNLOCK, '1') : sessionStorage.removeItem(UNLOCK); } catch (e) {} }
function isUnlocked() { try { return sessionStorage.getItem(UNLOCK) === '1'; } catch (e) { return false; } }

// Show the PIN form. mode 'enter' = ask for the PIN, 'create' = choose a new PIN (also used by "Change PIN").
function showGate(mode) {
  gateMode = mode;
  $('#manage').hidden = true; $('#gate').hidden = false;
  $('#gtitle').textContent = mode === 'enter' ? 'Staff only' : (getPin() ? 'Change PIN' : 'Create a PIN');
  $('#gtext').textContent = mode === 'enter' ? 'Enter your PIN to open Manage.' : 'Choose a 4 to 6 digit PIN. You will be asked for it every time you open Manage.';
  $('#pin2wrap').hidden = mode === 'enter'; $('#gpin2').required = mode === 'create';
  $('#gcancel').hidden = !(mode === 'create' && getPin());
  $('#gok').textContent = mode === 'enter' ? 'Unlock' : 'Save PIN';
  $('#gpin').value = ''; $('#gpin2').value = ''; $('#gerr').textContent = ''; $('#gpin').focus();
}
function openManage() { setUnlocked(true); $('#gate').hidden = true; $('#manage').hidden = false; renderManage(); }

/* TASK: Check what was typed in the PIN form.
   HOW: In 'enter' mode compare hashPin(typed) with the saved one; 5 wrong tries in a row pause the form for 30 seconds.
   In 'create' mode check it is 4 to 6 digits and that both boxes match, then save it and open Manage. */
on('#gform', 'submit', e => {
  e.preventDefault();
  const pin = $('#gpin').value, err = t => $('#gerr').textContent = t;
  if (gateMode === 'enter') {
    if (Date.now() < lockUntil) return err('Too many wrong tries. Wait ' + Math.ceil((lockUntil - Date.now()) / 1000) + ' seconds.');
    if (hashPin(pin) === getPin()) { fails = 0; return openManage(); }
    $('#gpin').value = '';
    if (++fails >= 5) { fails = 0; lockUntil = Date.now() + 30000; return err('Too many wrong tries. Wait 30 seconds.'); }
    return err('Wrong PIN. Try again.');
  }
  if (!/^\d{4,6}$/.test(pin)) return err('The PIN must be 4 to 6 digits (numbers only).');
  if (pin !== $('#gpin2').value) return err('The two PINs do not match.');
  try { localStorage.setItem(PIN_KEY, hashPin(pin)); } catch (x) { return err('Could not save the PIN in this browser.'); }
  toast('PIN saved'); openManage();
});

/* TASK: Start the page: add the shared parts, load the saved cart, and draw whatever this page has.
   HOW: Each render function quietly does nothing when its part is not on this page. The nav is see-through only on Home (data-page="home"). */
mountShell(); cart = loadCart();
if ($('#ac')) $('#ac').innerHTML = Object.keys(CATS).map(c => `<option value="${c}">${CATS[c].label}</option>`).join('');
renderMenu(); renderHero(); renderManage(); renderCart();
if (document.body.dataset.page === 'home') {
  const solidNav = () => $('#nav').classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', solidNav, {passive: true}); solidNav();
}

/* TASK: Decide if the Manage page may open.
   HOW: Only on manage.html. Already unlocked in this tab = open; otherwise show the PIN form. On every other page, forget the unlock. */
if (document.body.dataset.page === 'manage') { if (isUnlocked() && getPin()) openManage(); else showGate(getPin() ? 'enter' : 'create'); }
else setUnlocked(false);