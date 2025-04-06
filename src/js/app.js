  import { settings, select } from './settings.js';
  import Product from './components/Product.js';
  import Cart from './components/Cart.js';
  
  
  
  const app = {
    init: function() {
      const thisApp = this;
      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },

    initData: function() {
      const thisApp = this;
      thisApp.data = {}; 
    },

    initMenu: function() {
      const thisApp = this;
      const url = settings.db.url + '/' + settings.db.products; 

      fetch(url)
        .then(function(rawResponse){
          if(!rawResponse.ok) {
            throw new Error(`HTTP error! status: ${rawResponse.status}`);
          }
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('Pobrane dane:', parsedResponse);
          
          thisApp.data.products = parsedResponse;
          
          for(let productData in thisApp.data.products) {
            new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
          }
        })
        .catch(function(error){
          console.error('Błąd podczas pobierania danych:', error);
          const errorElement = document.createElement('div');
          errorElement.className = 'error-message';
          errorElement.textContent = 'Failed to load menu. Please try again later.';
          document.querySelector(select.containerOf.menu).appendChild(errorElement);
        });
    },

    initCart: function() {
      const thisApp = this;
      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
      thisApp.produstList = document.querySelector(select.containerOf.menu);

      thisApp.productList.addEventListener('add-to-cart', function(event){
        app.cart.add(event.detail.product);
      })


    },
  };

  app.init();
