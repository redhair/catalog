var State = function(state) {
	for (var key in state) {
		this[key] = state[key];
	}
}

State.prototype.setState = function(newState) {
	for (var key in newState) {
		this[key] = newState[key];
	}

	//render();
}

function makeElement(options) {
    var el = d.createElement(options.name);

    if (options.classes) {
        el.className = options.classes;
    }

    if (options.id) {
        el.id = options.id;
    }

    if (options.styles) {
        setStyles(el, options.styles);
    }

    if (options.events) {
        bindEvents(el, options.events);
    }

    if (options.html) {
        el.innerHTML = options.html;
    }

    return el;
}

function setStyles(element, styles) {
    for (var s in styles) {
        element.style[s] = styles[s];
    }
}

function bindEvents(element, events) {
    for (var e in events) {
        element.addEventListener(e, events[e]);
    }
}