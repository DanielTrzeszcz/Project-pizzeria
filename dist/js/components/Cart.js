import { settings, select, templates, classNames  } from '../settings.js';
import utils from '../utils.js'
import CartProduct from './Product.js'


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

  export default Cart;