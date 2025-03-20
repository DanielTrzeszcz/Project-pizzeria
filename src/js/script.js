/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
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
      thisProduct.getElements(); // Pobranie referencji do elementów DOM
      thisProduct.initAccordion(); // Wywołanie metody inicjalizującej akordeon
      thisProduct.initOrderForm(); // Wywołanie metody inicjalizującej formularz zamówienia
      thisProduct.processOrder(); // Wywołanie metody przetwarzającej zamówienie

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

    getElements() {
      const thisProduct = this;

      // Pobranie referencji do elementów DOM
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    }

    initAccordion() {
      const thisProduct = this;

      // Dodanie nasłuchiwacza zdarzeń z anonimową funkcją jako handlerem
      thisProduct.accordionTrigger.addEventListener('click', function (event) {
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

    initOrderForm() {
      const thisProduct = this;

      console.log('initOrderForm');

      // Nasłuchiwanie zdarzenia 'submit' na formularzu
      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault(); // Blokowanie domyślnej akcji (wysłanie formularza)
        thisProduct.processOrder(); // Przetwarzanie zamówienia
      });

      // Nasłuchiwanie zdarzenia 'change' na polach formularza
      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder(); // Przetwarzanie zamówienia
        });
      }

      // Nasłuchiwanie zdarzenia 'click' na przycisku "Dodaj do koszyka"
      thisProduct.cartButton.addEventListener('click', function (event) {
        event.preventDefault(); // Blokowanie domyślnej akcji (przejście do linku)
        thisProduct.processOrder(); // Przetwarzanie zamówienia
      });
    }

    processOrder() {
      const thisProduct = this;

      console.log('processOrder');

      // Przekształcenie formularza w obiekt
      const formData = utils.serializeFormToObject(thisProduct.form);
      console.log('formData', formData);

      // Ustawienie ceny na domyślną cenę produktu
      let price = thisProduct.data.price;

      // Dla każdej kategorii (param)...
      for (let paramId in thisProduct.data.params) {
        // Określenie wartości parametru, np. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        console.log(paramId, param);

        // Dla każdej opcji w tej kategorii
        for (let optionId in param.options) {
          // Określenie wartości opcji, np. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          console.log(optionId, option);

          // Sprawdzenie, czy opcja jest zaznaczona
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

          // Jeśli opcja jest zaznaczona i nie jest domyślna, zwiększ cenę
          if (optionSelected && !option.default) {
            price += option.price;
          }
          // Jeśli opcja nie jest zaznaczona, ale jest domyślna, zmniejsz cenę
          else if (!optionSelected && option.default) {
            price -= option.price;
          }
        }
      }

      // Aktualizacja wyświetlanej ceny
      thisProduct.priceElem.innerHTML = price;
    }
  }

  const app = {
    init: function () {
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

    initData: function () {
      const thisApp = this;

      thisApp.data = dataSource;
    },

    initMenu: function () {
      const thisApp = this;

      console.log('thisApp.data:', thisApp.data);

      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },
  };

  app.init();
}