import { select, templates } from '../settings.js';

 class Home {
   constructor() {
     const thisHome = this;
     thisHome.render();
     thisHome.initWidgets();
   }

   render() {
     const thisHome = this;
     const generatedHTML = templates.home();

     thisHome.dom = {};
     thisHome.dom.wrapper = document.querySelector(select.containerOf.home + ' div');
     thisHome.dom.wrapper.innerHTML = generatedHTML;

     thisHome.dom.carousel = thisHome.dom.wrapper.querySelector(select.containerOf.carousel);

   }

   initWidgets() {
     const thisHome = this;

     if (thisHome.dom.carousel && window.Flickity) {
       thisHome.flickity = new window.Flickity(thisHome.dom.carousel, {
         cellAlign: 'center',
         contain: true,
         wrapAround: true,
         autoPlay: 3000,
         prevNextButtons: false,
         pageDots: true,
         draggable: true,
         pauseAutoPlayOnHover: false,
       });
     } else {
       console.error('Flickity is not loaded or .carousel not found');
     }
   }
 }


 export default Home;