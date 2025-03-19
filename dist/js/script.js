/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: "#template-menu-product",
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 0,
      defaultMax: 10,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;
  
      thisProduct.id = id;
      thisProduct.data = data;
  
      thisProduct.renderInMenu(); // Wywołanie metody renderującej produkt
      thisProduct.initAccordion(); // Wywołanie metody inicjalizującej akordeon
  
      console.log('new Product:', thisProduct);
    }
  
    renderInMenu() {
      const thisProduct = this;
  
      // 1. Generowanie kodu HTML na podstawie szablonu Handlebars
      const generatedHTML = templates.menuProduct(thisProduct.data);
  
      // 2. Tworzenie elementu DOM na podstawie wygenerowanego HTML
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
  
      // 3. Znajdowanie kontenera menu na stronie
      const menuContainer = document.querySelector(select.containerOf.menu);
  
      // 4. Wstawienie stworzonego elementu DOM do kontenera menu
      menuContainer.appendChild(thisProduct.element);
    }
  
    initAccordion() {
      const thisProduct = this;
  
      // Znajdowanie klikalnego elementu
      const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
  
      // Dodanie nasłuchiwacza zdarzeń z anonimową funkcją jako handlerem
      clickableTrigger.addEventListener('click', function (event) {
        event.preventDefault(); // Zapobieganie domyślnej akcji
  
        // Znajdowanie aktywnego produktu
        const activeProduct = document.querySelector(select.all.menuProductsActive);
  
        // Jeśli istnieje aktywny produkt i nie jest to bieżący produkt, usuń klasę active
        if (activeProduct && activeProduct !== thisProduct.element) {
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
  
        // Przełączanie klasy active na bieżącym produkcie
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }
  }
  const app = {
    initData: function() {
      const thisApp = this;

      thisApp.data = dataSource;
    },

    initMenu: function() {
      const thisApp = this;

      console.log('thisApp.data:', thisApp.data);

      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    init: function() {
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      // Inicjalizacja danych
      thisApp.initData();

      // Inicjalizacja menu
      thisApp.initMenu();
    },
  };

  app.init();
}