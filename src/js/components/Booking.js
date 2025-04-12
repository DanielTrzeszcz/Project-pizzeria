import { templates, select, settings, classNames} from "../settings.js";
import AmountWidget from "./AmountWidget.js";
import utils from "../utils.js";
import DatePicker from "./DatePicker.js";
import HourPicket from "./HourPicker.js"


class Booking {
    constructor(element){
        const thisBooking = this;
        thisBooking.dom = {};
        thisBooking.element = element;
        thisBooking.dom.wrapper = element;
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);

        thisBooking.selectedTable = 0;

        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
    }

    getData() {
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);


        const params = {
            booking: [
                startDateParam,
                endDateParam
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ],
        };
        // console.log('getData params: params', params);
        const urls = {
            booking: settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
            eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
        };

        // console.log('get data urls:', urls);
        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ])
            .then(function (allResponses) {
                const bookingsResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];
                return Promise.all([
                    bookingsResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ]);
            })
            .then(function ([bookings, eventsCurrent, eventsRepeat]) {
                // console.log(bookings);
                // console.log(eventsCurrent);
                // console.log(eventsRepeat);
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
            });
    }

    parseData(bookings, eventsCurrent, eventsRepeat) {
        const thisBooking = this;

        thisBooking.booked = {};

        for (let item of bookings) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        for (let item of eventsCurrent) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        for (let item of eventsRepeat) {
            if (item.repeat == 'daily') {
                for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);

                }
            }
        }

        //console.log('thisBooking.booked:', thisBooking.booked);
        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table) {
        const thisBooking = this;

        if (typeof thisBooking.booked[date] == 'undefined') {
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);

        for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
            // console.log('loop:', hourBlock);

            if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
                thisBooking.booked[date][hourBlock] = [];
            }

            thisBooking.booked[date][hourBlock].push(table);
        }

    }

    initTables(clickedElement) {
        if (!clickedElement) return;
        const thisBooking = this;
        thisBooking.previousSelectedTable = document.querySelector('.table[data-table="' + thisBooking.selectedTable + '"]');

        if (clickedElement && clickedElement.classList.contains(classNames.booking.table)) {
            if (!clickedElement.classList.contains(classNames.booking.tableBooked)) {
                console.log(thisBooking.selectedTable, clickedElement);
                console.log(thisBooking.previousSelectedTable);
                if (thisBooking.selectedTable == 0) {
                clickedElement.classList.add(classNames.booking.chosenTable);
                thisBooking.selectedTable = clickedElement.getAttribute(settings.booking.tableIdAttribute);
                } else if (thisBooking.selectedTable == clickedElement.getAttribute(settings.booking.tableIdAttribute)) {
                clickedElement.classList.remove(classNames.booking.chosenTable);
                thisBooking.selectedTable = 0;
                } else if (thisBooking.previousSelectedTable != clickedElement) {
                    if (thisBooking.previousSelectedTable) {
                        thisBooking.previousSelectedTable.classList.remove(classNames.booking.chosenTable);
                    }
                clickedElement.classList.add(classNames.booking.chosenTable);
                thisBooking.selectedTable = clickedElement.getAttribute(settings.booking.tableIdAttribute);
                }

            } else {
                alert('This table is unavailable!');
            }
        }
    }

    sendBooking() {
        const thisBooking = this,
            payload = {},
            url = settings.db.url + '/' + settings.db.bookings;

        payload.starters = [];

        payload.date = thisBooking.dom.date.value;
        payload.hour = utils.numberToHour(thisBooking.dom.hour.value);
        payload.table = parseInt(thisBooking.selectedTable);
        payload.ppl = parseInt(thisBooking.dom.people.value);
        payload.duration = parseInt(thisBooking.dom.duration.value);
        payload.address = thisBooking.dom.address.value;
        payload.phone = thisBooking.dom.phone.value;

        for (const elem of thisBooking.dom.starters) {
            if (elem.checked == true) {
                payload.starters.push(elem.value);
            }
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        };

        fetch(url, options)
            .then(function(response) {
                return response.json();
            }).then(function(parsedResponse) {
                console.log('parsedResponse', parsedResponse);
                thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
                thisBooking.initTables();
            }).catch(function(error) {
                console.warn(error);
            });
    }

    updateDOM(){
        const thisBooking = this;

        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        let allAvailable = false;

        if (typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ) {
            allAvailable = true;
        }

        for (let table of thisBooking.dom.tables) {
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if (!isNaN(tableId)) {
                tableId = parseInt(tableId);
            }
            if (!allAvailable
                &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
            ) {
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }

        }
        thisBooking.selectedTable = null;
    }


    render(element){
        const thisBooking = this;
        const generateHTML = templates.bookingWidget();
        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = generateHTML;

        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);

        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
        thisBooking.dom.containerOfTables = document.querySelector(select.containerOf.tables);

        thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.bookingForm);
        thisBooking.dom.date = thisBooking.dom.wrapper.querySelector(select.booking.date);
        thisBooking.dom.hour = thisBooking.dom.wrapper.querySelector(select.booking.hour);
        thisBooking.dom.people = thisBooking.dom.wrapper.querySelector(select.booking.people);
        thisBooking.dom.duration = thisBooking.dom.wrapper.querySelector(select.booking.duration);
        thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
        thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
        thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    }

    initWidgets(){
        const thisBooking = this;

        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.hourPicker = new HourPicket(thisBooking.dom.hourPicker);

        thisBooking.initTables();

        thisBooking.dom.wrapper.addEventListener('updated', function () {
            thisBooking.updateDOM();
            for (let table of thisBooking.dom.tables) {
              table.classList.remove(classNames.booking.chosenTable);
            }
            thisBooking.selectedTable = 0;
        });

        thisBooking.dom.containerOfTables.addEventListener('click', function (event) {
            event.preventDefault();
            thisBooking.initTables(event.target);
        });

        thisBooking.dom.form.addEventListener('submit', function(event){
            event.preventDefault();
            if(thisBooking.selectedTable != 0){
                thisBooking.sendBooking();
            }
        });


    }
}

export default Booking;