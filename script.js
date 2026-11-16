/* ==========================================================================
   NEWLAND'S CAFE: script.js  (HTML/CSS/JS only; data is saved in this browser's localStorage)
   Every page loads this ONE file. Each page runs only its own part: the render functions
   quietly do nothing when their element is not on the page.
   Every function has a TASK (what it must do) and HOW (a beginner-friendly way to do it).

   TABLE OF CONTENTS
   1. SHARED        helpers, settings, menu data, saved data, pictures, My Order drawer, buttons
   2. HOME PAGE     index.html
   3. MENU PAGE     menu.html
   4. STORY PAGE    story.html   (text only, no code needed)
   5. CONTACT PAGE  contact.html
   6. MANAGE PAGE   manage.html  (PIN gate, tabs, orders, menu + stock, edit modal, messages)
   7. START         runs once when any page opens
   ========================================================================== */


/* ==========================================================================
   1. SHARED (used by every page)
   ========================================================================== */

/* ---- 1.1 Small helpers ---- */
const $ = s => document.querySelector(s);                                        // find one element
const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); };   // listen only if this page has that element
const peso = n => '₱' + n.toLocaleString();
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));   // makes typed text safe inside HTML
const page = document.body.dataset.page;                                         // 'home' | 'menu' | 'story' | 'contact' | 'manage'

/* TASK: Read and write saved data.
   HOW: localStorage only stores text, so use JSON.stringify / JSON.parse. try/catch stops crashes when storage is blocked or full. */
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } };

/* ---- 1.2 Settings and starting menu ---- */
const KEY = 'newlands-v1', CART_KEY = 'newlands-cart';   // names of the saved items in localStorage
const LOGO = 'images/logo.png.png';                       // shop logo: shown when an item's picture is not found
const EXTS = ['jpg', 'png', 'jpeg', 'webp'];              // picture types tried for each item

// Categories in tab order. folder = the group folder inside images/ (change it to match your folder names).
// add = add-ons [name, price]. sizes = cup sizes (hot drinks only).
const CATS = {
  hot:    {folder:'hot collections',    label:'Hot',    sizes:['8oz','12oz'], add:[['Extra Espresso',40]]},
  iced:   {folder:'iced collections',   label:'Iced',   add:[['Upsize',25],['Extra Espresso',40]]},
  frappe: {folder:'frappe collections', label:'Frappe', add:[['Upsize',25]]},
  fizz:   {folder:'fizz collections',   label:'Fizz',   add:[['Upsize',10],['Sinkers',20]]},
  brewed: {folder:'brewed collections', label:'Brewed', add:[]},
  meals:  {folder:'meal collections',   label:'Meals',  add:[['Extra Rice',25],['Extra Egg',20]]}
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

/* ---- 1.3 Saved data ---- */
let S = read(KEY, null) || seed();   // S = everything saved: items, orders, msgs, counters
S.items.forEach(i => { if (i.img) i.img = i.img.startsWith('data:') ? '' : i.img.split('/').pop(); });   // older versions saved a path or photo: keep only the file name
let cart = [], tt;                   // cart lines: {id, size, add:[add-on indexes], qty}; tt = toast timer

/* TASK: Build the first menu with stock for every item.
   HOW: Loop over MENU, make one object per item with a unique id, 20 in stock and no picture file name (img ''). */
function seed() {
  let id = 1; const items = [];
  for (const c in MENU) MENU[c].forEach(([name, ...p]) => items.push({id: id++, cat: c, name, p, stock: 20, img: ''}));
  return {items, orders: [], msgs: [], nextId: id, nextOrder: 1};
}
function save() { if (!write(KEY, S)) toast('Could not save. The browser storage may be full.'); }
const item = id => S.items.find(i => i.id === id);

/* TASK: Redraw what the page shows, and save then redraw.
   HOW: Every render function skips parts that are not on this page, so refresh() is safe everywhere. Call commit() after changing S. */
function refresh() { renderHero(); renderMenu(); renderCart(); renderManage(); }
function commit() { save(); refresh(); }

/* TASK: Show a short message at the bottom (e.g. "Order placed").
   HOW: Put the text in #toast, show it, hide it after 2.5 seconds with setTimeout. */
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(tt); tt = setTimeout(() => t.style.display = 'none', 2500); }

/* ---- 1.4 Item pictures (menu cards, Manage table and the modal preview) ---- */
/* TASK: Find the picture of an item inside your images folder.
   HOW: picList() lists the paths to try, best guess first: the file name typed in Edit, the item name ("iced matcha latte"), then the name without a last
   word like latte/frappe/fizz ("iced matcha"). Each is tried as .jpg/.png/.jpeg/.webp. Windows can hide extensions, so "latte.jpg" may really be
   "latte.jpg.jpg": both are tried. The <img> calls nextPic() each time a file is missing; when nothing is found the logo is shown. */
function picList(it) {
  const dir = 'images/' + CATS[it.cat].folder + '/', full = it.name.toLowerCase().trim();
  const names = [...new Set([(it.img || '').trim(), full, full.replace(/ (latte|frappe|fizz)$/, '')].filter(Boolean))];
  return names.flatMap(n => {
    const ext = n.match(/\.([a-z0-9]{3,4})$/i);
    return ext ? [n, n + '.' + ext[1]] : EXTS.flatMap(x => [n + '.' + x, n + '.' + x + '.' + x]);
  }).map(f => encodeURI(dir + f));
}
const picTag = (it, cls = '') => `<img class="${cls}" src="${esc(picList(it)[0])}" data-id="${it.id}" data-n="0" alt="${esc(it.name)}" onerror="nextPic(this)">`;
function nextPic(im) {
  const list = im._list || picList(item(+im.dataset.id)), n = +im.dataset.n + 1;   // _list is set by the modal preview
  if (n < list.length) { im.dataset.n = n; im.src = list[n]; }
  else { im.onerror = null; im.src = LOGO; im.classList.add('def'); }
}

/* ---- 1.5 My Order (the drawer opened by the "My Order" button on every page) ---- */
const inCart = id => cart.filter(l => l.id === id).reduce((s, l) => s + l.qty, 0);
function lineOpts(l) { const c = CATS[item(l.id).cat]; return [c.sizes ? c.sizes[l.size] : '', ...l.add.map(a => c.add[a][0])].filter(Boolean); }   // size + add-on names of a cart line

/* TASK: Compute the price of one cart line (price of the size + chosen add-ons) and of the whole cart.
   HOW: Look up the item, take p[size], add each chosen add-on's price. The cart total is the sum of unit price × qty. */
function unit(l) { const it = item(l.id); return it.p[l.size] + l.add.reduce((s, a) => s + CATS[it.cat].add[a][1], 0); }
const cartTotal = () => cart.reduce((s, l) => s + unit(l) * l.qty, 0);

/* TASK: Add the parts every page shares (My Order drawer + message box) so the HTML pages don't repeat them.
   HOW: insertAdjacentHTML adds this text as real HTML at the end of <body>. */
function mountShell() {
  document.body.insertAdjacentHTML('beforeend', `<div id="scrim" data-act="drawer"></div>
  <aside id="drawer" aria-label="My order"><div class="dh"><h3>My Order</h3><button class="ghost" data-act="drawer">Close</button></div><div id="cart"></div>
  <label for="cname">Name or table</label><input id="cname" maxlength="30" placeholder="Walk-in">
  <div class="total"><span>Total</span><span id="ctotal"></span></div><button class="pill dark wide" data-act="place">Place order</button></aside>
  <div id="toast" role="status"></div>`);
}

/* TASK: Draw My Order: each line with options and +/− buttons, the total, and the number on the nav button. Keep the cart for the next page.
   HOW: Loop over cart and build a row per line (data-i = the line's position). write() saves the cart so it survives page changes. */
function renderCart() {
  $('#cart').innerHTML = cart.map((l, i) => `<div class="line"><div>${esc(item(l.id).name)}<small>${lineOpts(l).join(', ') || 'Plain'} · ${peso(unit(l))}</small></div>
    <div class="qty"><button data-act="dec" data-i="${i}" aria-label="Fewer">−</button>${l.qty}<button data-act="inc" data-i="${i}" aria-label="More">+</button></div></div>`).join('')
    || '<p><small>Your order is empty. Pick something from the menu.</small></p>';
  $('#ctotal').textContent = peso(cartTotal());
  $('#count').textContent = cart.reduce((s, l) => s + l.qty, 0);
  write(CART_KEY, cart);
}

/* TASK: Change a line's quantity (+ or −). Remove the line at 0.
   HOW: Change cart[i].qty by d. Block + when stock is reached. When qty hits 0, splice(i, 1) deletes the line. */
function changeQty(i, d) {
  const l = cart[i];
  if (d > 0 && inCart(l.id) >= item(l.id).stock) return toast('No more stock for ' + item(l.id).name);
  l.qty += d; if (l.qty <= 0) cart.splice(i, 1);
  refresh();
}

/* TASK: Confirm the order: re-check stock, subtract it, save the order, clear the cart.
   HOW: Check each item's stock first (stop with a message if short). Then lower item.stock and push an order holding a text copy of its lines. */
function placeOrder() {
  if (!cart.length) return toast('Add something to your order first');
  for (const l of cart) if (inCart(l.id) > item(l.id).stock) return toast('Not enough stock for ' + item(l.id).name);
  const lines = cart.map(l => ({text: `${l.qty} × ${item(l.id).name}` + lineOpts(l).map(x => ' · ' + x).join('')}));
  cart.forEach(l => item(l.id).stock -= l.qty);
  const no = S.nextOrder++;
  S.orders.unshift({no, name: $('#cname').value.trim() || 'Walk-in', lines, total: cartTotal(), status: 'Pending', time: new Date().toLocaleString()});
  cart = []; $('#cname').value = ''; commit();
  document.body.classList.remove('drawer-open'); toast('Order #' + no + ' placed');
}

/* ---- 1.6 Buttons ----
   TASK: Make every button work from one place.
   HOW: Each button has data-act="name". Find the closest element with data-act and run the function with that name in `acts`.
   Shared buttons are listed here; each page adds its own with Object.assign(acts, {...}) in its section below. */
const acts = {
  drawer: () => document.body.classList.toggle('drawer-open'),
  inc: b => changeQty(+b.dataset.i, 1),
  dec: b => changeQty(+b.dataset.i, -1),
  place: placeOrder
};
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && acts[b.dataset.act]) acts[b.dataset.act](b); });


/* ==========================================================================
   2. HOME PAGE (index.html)
   ========================================================================== */

/* TASK: Fill the three numbers on the Home hero.
   HOW: Count drinks (every category except meals), meals, and orders marked Served. */
function renderHero() {
  if (!$('#hstats')) return;
  const drinks = S.items.filter(i => i.cat !== 'meals').length, meals = S.items.length - drinks;
  const served = S.orders.filter(o => o.status === 'Served').length;
  $('#hstats').innerHTML = `<div><b>${drinks}</b>Drinks on the menu</div><div><b>${meals}</b>Meals on the menu</div><div><b>${served}</b>Orders served</div>`;
}

/* TASK: The nav is see-through over the hero and turns solid brown after scrolling.
   HOW: Toggle the class "solid" when scrollY is more than 40. */
function initHome() {
  const solidNav = () => $('#nav').classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', solidNav, {passive: true}); solidNav();
}


/* ==========================================================================
   3. MENU PAGE (menu.html)
   ========================================================================== */
let curCat = 'hot', pending = null;   // chosen category tab; item id waiting in the size/add-ons dialog

/* TASK: Draw the category tabs and the picture cards of the chosen category.
   HOW: Build HTML with map().join('') and put it in the page with innerHTML. 5 or fewer in stock shows a badge; 0 disables the + button. */
function renderMenu() {
  if (!$('#items')) return;
  $('#tabs').innerHTML = Object.keys(CATS).map(c => `<button data-act="cat" data-v="${c}" class="${c === curCat ? 'on' : ''}">${CATS[c].label}</button>`).join('');
  $('#items').innerHTML = S.items.filter(i => i.cat === curCat).map(i => {
    const out = i.stock <= 0, left = i.stock - inCart(i.id);
    const tag = out ? 'Sold out' : i.stock <= 5 ? i.stock + ' left' : '';
    return `<article class="card ${out ? 'out' : ''}">${picTag(i)}${tag ? `<span class="badge">${tag}</span>` : ''}
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
  refresh(); toast(item(id).name + ' added to My Order');
}

/* Menu page buttons: category tabs, + button, "View Full Menu", carousel arrows */
Object.assign(acts, {
  cat: b => { curCat = b.dataset.v; renderMenu(); },
  add: b => openAdd(+b.dataset.id),
  full: b => { const t = $('#items'); t.classList.toggle('grid'); b.textContent = t.classList.contains('grid') ? 'Show less' : 'View Full Menu'; },
  prev: () => $('#items').scrollBy({left: -460, behavior: 'smooth'}),
  next: () => $('#items').scrollBy({left: 460, behavior: 'smooth'})
});


/* ==========================================================================
   4. STORY PAGE (story.html): text only, nothing to program here
   ========================================================================== */


/* ==========================================================================
   5. CONTACT PAGE (contact.html)
   ========================================================================== */

/* TASK: Save the Contact Us form so staff can read it in Manage.
   HOW: Push {n, e, m} into S.msgs, save(), clear the form and confirm with toast(). */
on('#cform', 'submit', e => {
  e.preventDefault();
  S.msgs.unshift({n: $('#cn').value, e: $('#ce').value, m: $('#cm').value});
  save(); e.target.reset(); toast('Message sent. Thank you!');
});


/* ==========================================================================
   6. MANAGE PAGE (manage.html)
   ========================================================================== */

/* ---- 6.1 PIN gate ----
   TASK: Ask for a PIN before the Manage page opens.
   HOW: Manage starts hidden and a PIN form (#gate) is shown. The first time there is no PIN, so the form asks to CREATE one (4 to 6 digits, typed twice).
   After that it asks for the PIN. Only a scrambled version (hashPin) is saved, never the PIN. sessionStorage remembers "unlocked" for this tab only;
   leaving Manage (or pressing Lock) asks again. NOTE: simple protection for a school project; a page with no server cannot keep a PIN truly secret. */
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
   In 'create' mode check it is 4 to 6 digits and both boxes match, then save it and open Manage. */
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

/* ---- 6.2 Top of the page: numbers + tabs ---- */
/* TASK: Show the four numbers and the small badges on the tabs.
   HOW: Add up order totals for sales; count pending orders, low stock (5 or fewer) and messages. */
function renderStats() {
  const sales = S.orders.reduce((s, o) => s + o.total, 0), pend = S.orders.filter(o => o.status === 'Pending').length;
  const low = S.items.filter(i => i.stock <= 5).length;
  $('#stats').innerHTML = `<div><b>${S.orders.length}</b>orders</div><div><b>${peso(sales)}</b>sales</div><div><b>${pend}</b>pending</div><div><b>${low}</b>low or sold out</div>`;
  $('#tc-orders').textContent = pend || ''; $('#tc-msgs').textContent = S.msgs.length || '';
}

/* TASK: Show one tab (Orders, Menu and Stocks, Messages) and hide the others.
   HOW: Give class "on" to the clicked tab button, then hide every .panel except the one whose id is "tab-<name>" using the hidden property. */
function showTab(t) {
  document.querySelectorAll('#mtabs button').forEach(b => b.classList.toggle('on', b.dataset.v === t));
  document.querySelectorAll('.panel').forEach(p => p.hidden = p.id !== 'tab-' + t);
}

/* TASK: Draw the whole Manage page. HOW: One small function per part below. */
function renderManage() {
  if (!$('#inv')) return;
  renderStats(); renderOrders(); renderInventory(); renderMessages();
}

/* ---- 6.3 Orders tab ---- */
/* TASK: List the orders with a "Mark as served" button.
   HOW: Map S.orders to HTML. data-no tells the button which order to change. */
function renderOrders() {
  $('#orders').innerHTML = S.orders.map(o => `<div class="order ${o.status === 'Served' ? 'done' : ''}">
    <div class="order-top"><b>#${o.no} · ${esc(o.name)}</b><b>${peso(o.total)}</b></div>
    <small>${esc(o.time)}</small>${o.lines.map(l => `<div>${esc(l.text)}</div>`).join('')}
    <p class="order-act"><button class="ghost" data-act="status" data-no="${o.no}">${o.status === 'Pending' ? 'Mark as served' : 'Served (undo)'}</button></p></div>`).join('') || '<p>No orders yet.</p>';
}

/* ---- 6.4 Menu and Stocks tab ---- */
/* TASK: Show every item in a table: picture, name, category, price, stock, Edit and Remove.
   HOW: Each price/stock cell is an <input> with data-f; the "change" listener below saves it. */
function renderInventory() {
  $('#inv').innerHTML = S.items.map(i => `<tr><td>${picTag(i, 'th')}</td><td>${esc(i.name)}</td><td>${CATS[i.cat].label}</td>
    <td><input type="number" min="1" data-f="price" data-id="${i.id}" value="${i.p[0]}" aria-label="Price of ${esc(i.name)}"></td>
    <td><input type="number" min="0" data-f="stock" data-id="${i.id}" value="${i.stock}" aria-label="Stock of ${esc(i.name)}"></td>
    <td><button class="ghost" data-act="edit" data-id="${i.id}">Edit</button> <button class="ghost" data-act="del" data-id="${i.id}">Remove</button></td></tr>`).join('');
}

/* TASK: Edit stock or price straight from the table.
   HOW: Read the input value and store it on the item (hot drinks keep the same 8oz→12oz gap), then commit(). */
function editField(el) {
  const it = item(+el.dataset.id), v = Math.max(0, parseInt(el.value, 10) || 0);
  if (el.dataset.f === 'stock') it.stock = v;
  else if (v > 0) { const gap = it.p.length > 1 ? it.p[1] - it.p[0] : 0; it.p = it.p.length > 1 ? [v, v + gap] : [v]; }
  commit();
}
document.addEventListener('change', e => { if (e.target.dataset.f) editField(e.target); });

/* "Add a menu item" / "Edit" modal.
   TASK: Open the modal, preview the picture, save a NEW item or the changes to an item.
   HOW: editId is null when adding and the item's id when editing. openEdit() copies the item's values into the form fields. The "Picture file name"
   box is optional: empty = the item name is used. showPreview() tries the same file names as the menu does. Only the file name is saved. */
let editId = null;
function showPreview() {
  const im = $('#pimg'), t = {name: $('#an').value, cat: $('#ac').value, img: $('#pf').value};
  im.classList.remove('def'); im.dataset.n = 0;
  if (!t.name.trim() && !t.img.trim()) { im.onerror = null; im.src = LOGO; return; }
  im._list = picList(t); im.onerror = () => nextPic(im); im.src = im._list[0];
}
function catChanged() {
  const c = CATS[$('#ac').value];
  $('#aplab').textContent = c.sizes ? 'Price (₱) for 8oz (12oz ' + (editId == null ? 'is ₱20 more)' : 'keeps its gap)') : 'Price (₱)';
  $('#pathhint').textContent = `Put the picture file in images/${c.folder}/. Leave this empty to use the item name (e.g. latte.jpg).`;
}
function openModal(title, button, it) {   // shared by openNew and openEdit
  editId = it ? it.id : null; $('#addform').reset();
  $('#ntitle').textContent = title; $('#nsave').textContent = button;
  if (it) { $('#an').value = it.name; $('#ac').value = it.cat; $('#ap').value = it.p[0]; $('#as').value = it.stock; $('#pf').value = it.img || ''; }
  catChanged(); showPreview(); $('#ndlg').showModal();
}
on('#ac', 'change', () => { catChanged(); showPreview(); });
on('#an', 'input', showPreview);
on('#pf', 'input', showPreview);

/* TASK: Save the modal: a NEW item, or the changes to the item being edited.
   HOW: When editing, copy the form values onto the existing item (it keeps its 8oz/12oz price gap); when adding, push a new item. Then commit() and close. */
on('#addform', 'submit', e => {
  e.preventDefault();
  const c = $('#ac').value, price = +$('#ap').value, name = $('#an').value.trim(), stock = +$('#as').value, img = $('#pf').value.trim();
  const it = editId == null ? null : item(editId);
  if (it) {
    const gap = it.p.length > 1 ? it.p[1] - it.p[0] : 20;
    if (it.cat !== c) cart = cart.filter(l => l.id !== it.id);   // old size/add-on choices don't fit a new category
    Object.assign(it, {name, cat: c, stock, img, p: CATS[c].sizes ? [price, price + gap] : [price]});
  } else S.items.push({id: S.nextId++, cat: c, name, p: CATS[c].sizes ? [price, price + 20] : [price], stock, img});
  commit(); $('#ndlg').close(); toast(it ? 'Item updated' : 'Menu item added');
});

/* ---- 6.5 Messages tab ---- */
/* TASK: List the messages sent from the Contact Us page. HOW: Map S.msgs to HTML. */
function renderMessages() {
  $('#msgs').innerHTML = S.msgs.map(m => `<div class="order"><b>${esc(m.n)}</b> (${esc(m.e)})<br>${esc(m.m)}</div>`).join('') || '<p>No messages yet.</p>';
}

/* Manage page buttons: PIN, tabs, orders, items, reset */
Object.assign(acts, {
  changepin: () => showGate('create'),
  gcancel: openManage,
  lock: () => { setUnlocked(false); location.reload(); },
  tab: b => showTab(b.dataset.v),
  status: b => { const o = S.orders.find(o => o.no === +b.dataset.no); o.status = o.status === 'Pending' ? 'Served' : 'Pending'; commit(); },
  newitem: () => openModal('Add a menu item', 'Save item'),
  edit: b => openModal('Edit menu item', 'Save changes', item(+b.dataset.id)),
  closen: () => $('#ndlg').close(),
  del: b => { const it = item(+b.dataset.id); if (!confirm('Remove ' + it.name + ' from the menu?')) return; S.items = S.items.filter(i => i !== it); cart = cart.filter(l => l.id !== it.id); commit(); },
  reset: () => { if (!confirm('Delete all orders, messages and stock changes?')) return; S = seed(); cart = []; commit(); toast('Data reset'); }
});

/* TASK: Decide if the Manage page may open.
   HOW: Fill the category list of the modal. Already unlocked in this tab = open; otherwise show the PIN form. */
function initManage() {
  $('#ac').innerHTML = Object.keys(CATS).map(c => `<option value="${c}">${CATS[c].label}</option>`).join('');
  if (isUnlocked() && getPin()) openManage(); else showGate(getPin() ? 'enter' : 'create');
}


/* ==========================================================================
   7. START (runs once when any page opens)
   HOW: Add the shared parts, load the saved cart, draw the page, then run the setup of the current page.
   Leaving Manage forgets the unlock, so every visit to Manage asks for the PIN.
   ========================================================================== */
mountShell();
cart = read(CART_KEY, []).filter(l => item(l.id));
refresh();
if (page === 'home') initHome();
if (page === 'manage') initManage(); else setUnlocked(false);