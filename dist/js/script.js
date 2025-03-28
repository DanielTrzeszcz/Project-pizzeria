/* global Handlebars, utils */

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
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
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: '.cart__total-number',
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

  class AmountWidget {
    constructor(element) {
      const thisWidget = this;
      
      thisWidget.value = settings.amountWidget.defaultValue;
      thisWidget.getElements(element);
      thisWidget.setValue(thisWidget.input.value);
      thisWidget.initActions();
    }

    getElements(element) {
      const thisWidget = this;
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value) {
      const thisWidget = this;
      const newValue = parseInt(value);

      if(newValue !== thisWidget.value 
        && !isNaN(newValue)
        && newValue >= settings.amountWidget.defaultMin
        && newValue <= settings.amountWidget.defaultMax
      ) {
        thisWidget.value = newValue;
        thisWidget.input.value = thisWidget.value;
        thisWidget.announce();
      } else {
        thisWidget.input.value = thisWidget.value;
      }
    }

    announce() {
      const thisWidget = this;
      const event = new CustomEvent('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }

    initActions() {
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function() {
        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function(event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });

      thisWidget.linkIncrease.addEventListener('click', function(event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
  }

  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.params;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }

    getElements(element) {
      const thisCartProduct = this;

      thisCartProduct.dom = {
        wrapper: element,
        amountWidget: element.querySelector(select.cartProduct.amountWidget),
        price: element.querySelector(select.cartProduct.price),
        edit: element.querySelector(select.cartProduct.edit),
        remove: element.querySelector(select.cartProduct.remove)
      };
    }

    initAmountWidget() {
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('updated', function() {
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }

    initActions() {
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event) {
        event.preventDefault();
        console.log('Edycja produktu:', thisCartProduct.id);
      });

      thisCartProduct.dom.remove.addEventListener('click', function(event) {
        event.preventDefault();
        thisCartProduct.remove();
      });
    }

    remove() {
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct
        }
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
  }

  class Cart {
    constructor(element) {
      const thisCart = this;
  
      thisCart.products = [];
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;
      thisCart.totalPrice = 0;
      
      thisCart.getElements(element);
      thisCart.initActions();
    }
  
    getElements(element) {
      const thisCart = this;
  
      thisCart.dom = {
        wrapper: element,
        toggleTrigger: element.querySelector(select.cart.toggleTrigger),
        productList: element.querySelector(select.cart.productList),
        deliveryFee: element.querySelector(select.cart.deliveryFee),
        subtotalPrice: element.querySelector(select.cart.subtotalPrice),
        totalPrice: element.querySelectorAll(select.cart.totalPrice),
        totalNumber: element.querySelector(select.cart.totalNumber),
        form: element.querySelector(select.cart.form),
        phone: element.querySelector(select.cart.phone),
        address: element.querySelector(select.cart.address),
        formSubmit: element.querySelector(select.cart.formSubmit)
      };
    }
  
    initActions() {
      const thisCart = this;
  
      thisCart.dom.toggleTrigger.addEventListener('click', function() {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
  
      thisCart.dom.productList.addEventListener('remove', function(event) {
        const productToRemove = event.detail.cartProduct;
        const index = thisCart.products.findIndex(product => product.id === productToRemove.id);
        
        if (index !== -1) {
          thisCart.products.splice(index, 1);
          event.target.classList.add('removing');
          setTimeout(() => {
            event.target.remove();
            thisCart.update();
          }, 300);
        }
      });
  
      thisCart.dom.productList.addEventListener('updated', function(event) {
        if(event.target.classList.contains('widget-amount')) {
          const productElement = event.target.closest('li');
          const productId = productElement.dataset.id;
          const newAmount = parseInt(event.target.querySelector(select.widgets.amount.input).value);
          
          const product = thisCart.products.find(item => item.id === productId);
          if (product) {
            product.amount = newAmount;
            product.price = product.priceSingle * product.amount;
            thisCart.update();
          }
        }
      });
  
      thisCart.dom.form.addEventListener('submit', function(event) {
        event.preventDefault();
        thisCart.sendOrder();
      });
    }
  
    add(menuProduct) {
      const thisCart = this;
      
      const generatedId = `${menuProduct.id}-${Date.now()}`;
      
      const productToAdd = {
        id: generatedId,
        name: menuProduct.name,
        amount: menuProduct.amount,
        priceSingle: menuProduct.priceSingle,
        price: menuProduct.price,
        params: menuProduct.params
      };
      
      thisCart.products.push(productToAdd);
      thisCart.update();
      
      return productToAdd;
    }
  
    update() {
      const thisCart = this;
      
      thisCart.dom.productList.innerHTML = '';
      
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;
      
      for(let product of thisCart.products) {
        const generatedHTML = templates.cartProduct(product);
        const generatedDOM = utils.createDOMFromHTML(generatedHTML);
        generatedDOM.dataset.id = product.id;
        
        new CartProduct(product, generatedDOM);
        thisCart.dom.productList.appendChild(generatedDOM);
        
        thisCart.totalNumber += product.amount;
        thisCart.subtotalPrice += product.price;
      }
      
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
      
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice.toFixed(2);
      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee.toFixed(2);
      
      for(let priceElem of thisCart.dom.totalPrice) {
        priceElem.innerHTML = thisCart.totalPrice.toFixed(2);
      }
    }
  
    sendOrder() {
      const thisCart = this;
    
      // Aktualizacja danych koszyka
      thisCart.update();
    
      // Przygotowanie obiektu payload
      const payload = {
        address: thisCart.dom.address.value.trim(),
        phone: thisCart.dom.phone.value.trim(),
        totalPrice: parseFloat(thisCart.totalPrice),
        subtotalPrice: parseFloat(thisCart.subtotalPrice),
        totalNumber: parseInt(thisCart.totalNumber),
        deliveryFee: parseFloat(thisCart.deliveryFee),
        products: thisCart.products.map(product => ({
          id: product.id,
          name: product.name,
          amount: product.amount,
          priceSingle: product.priceSingle,
          price: product.price,
          params: product.params
        }))
      };
    
      console.log('Payload to send:', payload);
    
      const url = settings.db.url + '/' + settings.db.orders;
    
      // Walidacja danych
      if (!thisCart.dom.phone.value || !thisCart.dom.address.value) {
        alert('Please provide phone number and delivery address!');
        return;
      }
    
      // Opcje żądania HTTP
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      };
    
      // UI podczas ładowania
      thisCart.dom.formSubmit.disabled = true;
      thisCart.dom.formSubmit.textContent = 'Sending...';
    
      // Wysłanie zamówienia
      fetch(url, options)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Order saved:', data);
    
          // Powiadomienie użytkownika
          const notification = document.createElement('div');
          notification.classList.add('order-notification');
          notification.innerHTML = `
            <p>Thank you! Your order #${data.id} has been placed.</p>
            <p>We'll contact you shortly.</p>
          `;
          document.body.appendChild(notification);
    
          setTimeout(() => notification.classList.add('show'), 10);
          setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
          }, 5000);
    
          // Czyszczenie koszyka
          thisCart.products = [];
          thisCart.dom.form.reset();
          thisCart.update();
        })
        .catch(error => {
          console.error('Error:', error);
          thisCart.dom.formSubmit.disabled = false;
          thisCart.dom.formSubmit.textContent = 'Try Again';
          alert(`Order failed: ${error.message}. Please check your connection and try again.`);
        })
        .finally(() => {
          setTimeout(() => {
            if (thisCart.dom.formSubmit.textContent === 'Try Again') return;
            thisCart.dom.formSubmit.disabled = false;
            thisCart.dom.formSubmit.textContent = 'Order';
          }, 2000);
        });
    }
    
  }

  class Product {
    constructor(id, data) {
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.priceSingle = data.price;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }

    renderInMenu() {
      const thisProduct = this;
      const generatedHTML = templates.menuProduct(thisProduct.data);
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      const menuContainer = document.querySelector(select.containerOf.menu);
      menuContainer.appendChild(thisProduct.element);
      if (!thisProduct.data.name || !thisProduct.data.price) {
        thisProduct.element.remove();
        return;
      }
      
    }

    getElements() {
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion() {
      const thisProduct = this;
      thisProduct.accordionTrigger.addEventListener('click', function(event) {
        event.preventDefault();
        const activeProduct = document.querySelector(select.all.menuProductsActive);
        if (activeProduct && activeProduct !== thisProduct.element) {
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }

    initOrderForm() {
      const thisProduct = this;
      thisProduct.form.addEventListener('submit', function(event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for(let input of thisProduct.formInputs) {
        input.addEventListener('change', function() {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function(event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    initAmountWidget() {
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      
      thisProduct.amountWidgetElem.addEventListener('updated', function() {
        thisProduct.processOrder();
      });
    }

    processOrder() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      let price = thisProduct.priceSingle;

      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        for(let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

          if(optionSelected && !option.default) {
            price += option.price;
          } else if(!optionSelected && option.default) {
            price -= option.price;
          }

          const optionImage = thisProduct.imageWrapper.querySelector(`.${paramId}-${optionId}`);
          if(optionImage) {
            if(optionSelected) {
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            } else {
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
      }

      thisProduct.price = price * thisProduct.amountWidget.value;
      thisProduct.priceElem.innerHTML = thisProduct.price;
    }

    addToCart() {
      const thisProduct = this;
      
      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.price,
        params: thisProduct.prepareCartProduct()
      };
      
      app.cart.add(productSummary);
    }

    prepareCartProduct() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};
      
      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        
        params[paramId] = {
          label: param.label,
          options: {}
        };
        
        for(let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          
          if(optionSelected) {
            params[paramId].options[optionId] = option.label;
          }
        }
      }
      
      return params;
    }
  }

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
    },
  };

  app.init();
}