import { settings, select,classNames} from "./settings.js";
import Product from "./components/Product.js";
import Cart from "./components/Cart.js";
import Booking from './components/Booking.js';
import Home from "./components/Home.js";




const app = {

  initPages: function(){
    const thisApp = this;
    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);

    thisApp.quickLinks = document.querySelectorAll(select.home.links);

    const idFromHash =  window.location.hash.replace('#/','');

    let pageMachineHash = thisApp.pages[0].id;

    for(let page of thisApp.pages){
      if(page.id == idFromHash){
        pageMachineHash = page.id;
        break;
      }
    }

    thisApp.activatePage(pageMachineHash);

    for(let link of thisApp.navLinks){
      link.addEventListener('click', function(event){
        const clickedElement = this;
        event.preventDefault();

        // get page id from href attribute
        const id = clickedElement.getAttribute('href').replace('#','');

        // run thisApp.activePage with that id
        thisApp.activatePage(id);

        // change url hash
        window.location.hash = '#/' + id;
      });
    }

  },

  activatePage: function(pageId){
    const thisApp = this;

    /*add class "active"vto matchin pages, remove from non-matching*/
    for( let page of thisApp.pages){
      page.classList.toggle(classNames.pages.active, page.id == pageId);
      }

    /*add class "active"vto matchin links, remove from non-matching*/
    for( let link of thisApp.navLinks){
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute("href") == '#' +  pageId
      );
      }
  },

  initBooking: function(){
    const thisApp = this;
    const bookingElem = document.querySelector(select.containerOf.booking);
    thisApp.booking = new Booking(bookingElem);
  },

  initCart: function(){
    const thisApp = this;
    const catrElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(catrElem);
    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart',function(event){
      app.cart.add(event.detail.product)
    });
  },

  initHome: function(){
    new Home();
    const thisApp = this;

    thisApp.quickLinks = document.querySelectorAll(select.home.links);


    for (let link of thisApp.quickLinks) {
      link.addEventListener('click', function(event){
        event.preventDefault();
        const clickedElement = this;

        const id = clickedElement.getAttribute('href').replace('#', '');
        thisApp.activatePage(id);

        window.location.hash = '#/' + id;
      });
    }
  },

  initMenu: function(){
    const thisApp = this;
    //console.log('thisApp.data',thisApp.data)
    for (let productData in thisApp.data.products){
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },

  initData: function(){
    const thisApp = this;
    thisApp.data = [];
    const url = settings.db.url + '/' + settings.db.products;
    fetch(url)
      .then(function(rawResponse){
        return rawResponse.json();
      })
      .then(function(parsedResponse){
        thisApp.data.products = parsedResponse;
        thisApp.initMenu();
      })
  },

  init: function(){
    const thisApp = this;
    thisApp.initPages();
    thisApp.initData();
    thisApp.initCart();
    thisApp.initBooking();
    thisApp.initHome();
  },
  
};

app.init();
export default app;
