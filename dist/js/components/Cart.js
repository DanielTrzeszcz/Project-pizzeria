import { select, settings, classNames, templates } from "../settings.js";
import utils from "../utils.js"
import CartProduct from "./CartProduct.js";

class Cart{
    constructor(element){
      const thisCart = this;
      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
      //thisCart.add(menuProduct);
      //console.log('new cart', thisCart);
    }

    getElements(element){
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subTotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
      thisCart.dom.totalPrice2 = thisCart.dom.wrapper.querySelector(select.cart.totalPrice2);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    }

    initActions(){
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click',function(event){
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove',function(event){
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });

    }

    add(menuProduct){
      const thisCart = this;
      //console.log('adding product', menuProduct);
      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDom = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(generatedDom);
      thisCart.products.push(new CartProduct(menuProduct, generatedDom));
      //console.log('thisCard.products',thisCart.products);
      thisCart.update();

    }

    update(){
      const thisCart = this;
      const deliveryFee = settings.cart.defaultDeliveryFee;
      let totalNumber = 0,
          subTotalPrice = 0;

      for(let product of thisCart.products){
        totalNumber += product.amount;
        subTotalPrice += parseInt(product.price);
      }

      if(totalNumber > 0){
        thisCart.totalPrice = parseInt(deliveryFee) + subTotalPrice;
      }else {
        thisCart.totalPrice = 0;
      }

      //console.log('subTotalPrice: ', subTotalPrice);

      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      thisCart.dom.subTotalPrice.innerHTML = subTotalPrice;
      thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
      thisCart.dom.totalPrice2.innerHTML = thisCart.totalPrice;
      thisCart.dom.totalNumber.innerHTML = totalNumber;
    }

    remove(cartProduct){
      const thisCart = this;

      cartProduct.dom.wrapper.remove();

      const productIndex = thisCart.products.indexOf(cartProduct);
      thisCart.products.splice(productIndex,1);
      console.log('remove products');
      thisCart.update();
    }

    sendOrder(){
      const thisCart = this,
            url = settings.db.url + '/' + settings.db.orders;

      let payload = {
        address: thisCart.dom.form.address.value,
        phone: thisCart.dom.form.phone.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.dom.subTotalPrice.innerHTML,
        totalNumber: thisCart.dom.totalNumber.innerHTML,
        deliveryFee: thisCart.dom.deliveryFee.innerHTML,
        products: []
      };

      for(let prod of thisCart.products) {
        payload.products.push(prod.getData());
      }
      console.log('payload',payload);

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      fetch(url, options)
        .then(function(response){
          return response.json();
        }).then(function(parsedResponse){
          console.log('parsedResponse',parsedResponse)
        });
    }

    clearCart(){
      const thisCart = this;
      thisCart.products = [];

    }
  }

export default Cart;