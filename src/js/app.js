import { settings, select, classNames} from "./settings.js";
import Product from "./components/product.js";
import Cart from "./components/Cart.js";


const app = {
  initPages: function () {
    const thisApp = this;

    thisApp.pages = document.querySelector(select.containerOf.pages).children;

    thisApp.navLinks = document.querySelectorAll(select.nav.links);
    
    thisApp.acitvatePage(thisApp.pages[0].id);

    
  },
  
  activatePage: function (pageId){
    const thisApp = this;

    /* add class "active" to matching pages, remove form non-matching */
    for (let page of thisApp.pages) {  
    page.classList.toggle(classNames.pages.active, page.id == pageId);
  }

    /* add class "active" to matching links, remove form non-matching */
    for (let link of thisApp.navLinks) {  
      link.classList.toggle(
        classNames.nav.active, 
        link.getAttribute('href') == '#' + pageId
      );
    }

  },
  initCart: function () {
    const thisApp = this;
    const catrElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(catrElem);
    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart', function (event) {
      app.cart.add(event.detail.product)
    });
  },
  initMenu: function () {
    const thisApp = this;
    //console.log('thisApp.data',thisApp.data)
    for (let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },
  initData: function () {
    const thisApp = this;
    thisApp.data = [];
    const url = settings.db.url + '/' + settings.db.products;
    fetch(url)
      .then(function (rawResponse) {
        return rawResponse.json();
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
        thisApp.data.products = parsedResponse;
        thisApp.initMenu();
      })
    console.log('thisApp.data', JSON.stringify(thisApp.data));
  },
  init: function () {
    const thisApp = this;
    /*console.log('*** App starting ***');
    console.log('thisApp:', thisApp);
    console.log('classNames:', classNames);
    console.log('settings:', settings);
    console.log('templates:', templates);*/
    thisApp.initPages();
    thisApp.initData();
    thisApp.initCart();
  },
};

app.init();
export default app;