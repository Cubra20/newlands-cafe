# Newland’s Café – Menu and Ordering System

Hi! This is our school project: a website for **Newland’s Café**, a school-based coffee shop run by the student baristas of the Sisters of Mary School. Customers can look at the menu and make an order, and the staff can manage the orders, the menu and the stock.

I made it using only **HTML, CSS and JavaScript**. No Python, no framework and no database. It was my first time making a whole website with many pages, so I tried to keep the code simple and I added comments in the code so my teammates can understand it.

<!-- Add a screenshot here, for example: ![Home page](screenshot-home.png) -->

## What it can do

**For customers**
- See the menu by category: Hot, Iced, Frappe, Fizz, Brewed and Meals
- Hot drinks have sizes (8oz or 12oz) and some items have add-ons like Extra Espresso or Extra Rice
- Add items to **My Order** (it opens from the right side) and place the order with a name or table
- My Order stays even if you go to another page
- Read the story of the café and send a message in the Contact page

**For the staff (Manage page)**
- Protected by a **PIN**
- Three tabs: **Orders**, **Menu and Stocks**, **Messages**
- Orders: see all orders and mark them as served
- Menu and Stocks: add, edit or remove menu items, and change the price and stock right in the table
- Stock goes down every time an order is placed. At 5 or less it shows a “left” badge and at 0 it shows “Sold out” and the item can’t be ordered
- Messages: read what the customers sent in the Contact page
- Shows the number of orders, total sales, pending orders and low stock

## Pages

| File | Page |
|------|------|
| `index.html` | Home |
| `menu.html` | Menu |
| `story.html` | Our Story |
| `contact.html` | Contact Us |
| `manage.html` | Manage (staff only, needs PIN) |

## How to run it

1. Download or clone this repository
2. Make sure the `images` folder is in the same folder as `index.html` (see below)
3. Open `index.html` in your browser (we used Chrome and Edge)

That’s all. No installing needed. You only need internet for the Google Fonts. Without internet it still works but the fonts will look different.

## The PIN

- The first time you open **Manage**, it asks you to **create a PIN** (4 to 6 numbers)
- After that it asks for the PIN every time you open Manage
- After 5 wrong tries you need to wait 30 seconds
- There are **Lock** and **Change PIN** buttons inside Manage
- If you forget the PIN: open the browser developer tools, go to Application → Local Storage, and delete the item called `newlands-pin`

## Pictures of the items

The pictures are not inside the code. The website looks for them in the `images` folder, in the folder of the item’s category, using the name of the item:

```
images/
├── hot collections/
├── iced collections/
├── frappe collections/
├── fizz collections/
├── brewed collections/
├── meal collections/
├── logo.png
├── hero.jpg
└── story.jpg
```

Example: the picture for “Iced Matcha Latte” can be `images/iced collections/iced matcha latte.jpg` (or `iced matcha.jpg`, it also tries without the last word like latte, frappe or fizz).

- If the picture is not found, the shop logo is shown instead
- If the name of the file is different, click **Edit** on the item in Manage and type the real file name in “Picture file name”
- If you change the name of a folder, also change it in `CATS` at the top of `script.js`
- Note: Windows can hide file extensions, so check the real file names if the logo, hero or story picture does not show up

## Files

```
index.html, menu.html, story.html, contact.html, manage.html   the pages
style.css                                                       all the design
script.js                                                       all the programming
images/                                                         pictures
```

Both `style.css` and `script.js` are arranged **per page** with titles and comments. There is a table of contents at the top of `script.js`. The first parts are shared by all pages, then each page has its own part. Each function has a **TASK** (what it should do) and a **HOW** (a simple way to do it).

## Where the data is saved

Everything (menu, stock, orders, messages, My Order and the PIN) is saved in the **browser’s localStorage**. This means:
- It stays when you close the page
- It is saved only in that browser and that computer. Another computer will have its own data
- If you clear the browser data, it will be gone. The **Reset all data** button in Manage also deletes the orders, messages and stock changes

## Limitations

- The PIN is only simple protection. Since there is no server, someone who knows how to use the browser developer tools can still get around it. Good enough for a school project, not for a real shop
- No real database, so no sharing of orders between different computers
- No online payment, it only records the order

## What I learned

- How to make a website with many pages that share the same CSS and JavaScript
- Using `localStorage` to save data without a database
- Making the page with JavaScript (building HTML from data, buttons, pop-up dialogs)
- Organizing the code, removing repeated code and writing comments
- Using Git and GitHub

## Credits

- Menu and story are from **Newland’s Café** of the **Sisters of Mary School**. Every cup helps a student learn!
- Team members: *(add the names here)*