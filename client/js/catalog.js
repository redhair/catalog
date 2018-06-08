var Catalog = ((d) => {
	'use-strict';

	var _init = false;
	var state = {};

	var $api = 'http://206.189.176.175/api';
	var $catalogResource = $api + '/organizations/wayne-valley-high-school-football/all';
	var $productResource = $api + '/product';
	var $pdp_container = d.getElementById('pdp_container');
	var $checkout_container = d.getElementById('checkout_container');
	var $catalog_container = d.getElementById('catalog_container');
	var $order_container = d.getElementById('order_container');

	$('.filtersToggle').on('click', () => {
		$('.filtersContent').toggleClass('open')
		if ($('.filtersContent').hasClass('open')) {
			$('.fa-chevron-down').removeClass('fa-chevron-down').addClass('fa-chevron-up');
			$('.filtersContent').slideDown();
		} else {
			$('.fa-chevron-up').removeClass('fa-chevron-up').addClass('fa-chevron-down');
			$('.filtersContent').slideUp();
		}
	});

	$('.searchBar').keyup((e) => {
		queryData($(e.target).val().toLowerCase());
	}).focus();

	function toggleCategory(category_ids) {
		if (category_ids.length === 0) {
			state.filteredProducts = state.products;
		} else {
			state.filteredProducts = state.products.filter((product) => {
				return category_ids.indexOf(product.category_id) !== -1;
			});
		}
		paintCatalog();
	}

	function queryData(input) {
		var needle = input.trim().toLowerCase();
		state.filteredProducts = state.products.filter((product) => { 
			return product.product_name.toLowerCase().indexOf(needle) !== -1;
		});
		paintCatalog();
	}

	function openDetails(product_id) {		
		fetch($productResource + '/' + product_id).then((res) => {
		    return res.json();
		}).then((product) => {
			state.product = product[0];
			state.product.colors = JSON.parse(state.product.colors);
			state.product.sizes = JSON.parse(state.product.sizes);
			state.product.custom_fields = JSON.parse(state.product.custom_fields);
			for (var x = 0; x < state.product.images.length; x++) {
	          state.product.images[x].associations = JSON.parse(state.product.images[x].associations);
	        }
			var template = `
				<div class="row">
				  <div class="col-xs-12">
				    <a onclick="Catalog.openCatalog()"><i class="fa fa-arrow-left clickable"></i></a>
				  </div>
				</div>
				<div id="details" class="productDetailsContainer row center-xs">
				  <div class="col-xs-12 col-sm-8 row">
				  	<div id="thumbnail_container" class="col-xs-12 col-lg-2 thumbnailContainer"></div>
				  	<div class="col-xs-12 col-lg-10 first-xs last-lg">
				    	<img id="main_image" class="details__img" src="${state.product.images[0].image_url}">
				    </div>
				  </div>
				  <div class="col-xs-12 col-sm-4">
				    <h1 id="name" style="margin-top:0;">${state.product.product_name}</h1>
				    <h4 id="price">$${state.product.price}</h4>
				    <p id="description" class="description">${state.product.description}</p>
				    <div>
				    	<select id="variant" onchange="Catalog.changeActiveVariant(this.value)">
				    	${product[0].colors.map((color, i) => `
						    <option value="${color.label}"><div style="width:10px;height:10px;background:${color.value};"></div>${color.label}</option>
						  `.trim()).join('')}
				    	</select>
				    </div>
				    <div>
				    	<select id="size">
				    	${state.product.sizes.map((size, i) => `
						    <option value="${size.label}">${size.label}</option>
						  `.trim()).join('')}
					    </select>
				    </div>
				    <div id="customization" style="display:flex;flex-direction:column;">
				    	${state.product.custom_fields.map((field, i) => `
				    		<div class="customizationField">
						    	<span style="text-transform:none;margin-right:10px;">${field.label}:</span>
						    	<input type=${field.type}>
						    </div>
						`.trim()).join('')}
				    </div>
				    <button id="add_to_cart" class="btn btn--add">Add To Cart</button>
				  </div>
				</div>`;
			$pdp_container.innerHTML = template;
			//d.getElementById('thumbnail_container').children[0].className += ' active';
			var addToCart = d.getElementById('add_to_cart');
			addToCart.onclick = function() {
				Cart.add(state.product);
			}
			$catalog_container.style.display = 'none';
			$checkout_container.style.display = 'none';
			$order_container.style.display = 'none';
			$pdp_container.style.display = 'block';
			changeActiveVariant(getActiveVariant());
			scrollToTop();
		});
		
	}

	function scrollToTop() {
		window.scrollTo(0,0);
	}

	function openCheckout() {
		if(Cart.isCartEmpty()) {
			return;
		}

		Cart.hideCart();
		$catalog_container.style.display = 'none';
		$pdp_container.style.display = 'none';
		$order_container.style.display = 'none';
		$checkout_container.style.display = 'block';
		scrollToTop();
	}

	function openCatalog() {
		$checkout_container.style.display = 'none';
		$pdp_container.style.display = 'none';
		$order_container.style.display = 'none';
		$catalog_container.style.display = 'block';
		scrollToTop();
	}

	function getVariantImageIndex(variant, product) {
		var images = product.images;
		for (var i = 0; i < images.length; i++) {
			var associations = images[i].associations;
			for (var j = 0; j < associations.length; j++) {
				if (associations[j].label === variant
				&&  associations[j].checked) {
					return i;
				}
			}
		}
	}

	function openOrderScreen(err, order_id) {		
		var template = `
			<div class="row">
			    <div class="col-xs-12">
			        <a onclick="Catalog.openCatalog()"><i class="fa fa-arrow-left clickable"></i></a>
			    </div>
			</div>
			<div class="orderConfirmation row center-xs">
				${err ? `<h2>An Error Has Occured Your Order Has Not Been Placed</h2><hr>` : `<h2>Thank You! Your Order Number is ${order_id}!</h2><p style="text-transform: none;">You should be getting an email confirming your order shortly.</p>`}
			</div>`;
		$order_container.innerHTML = template;

		if (!err) {
			var productsInCart = Cart.getProducts();
			for (var p in productsInCart) {
				var product = productsInCart[p];
				var item = d.createElement('div');
				item.className = 'orderItem row';
				var itemTemplate = `
					<img src="${product.details.images[getVariantImageIndex(product.variant, product.details)] ? product.details.images[getVariantImageIndex(product.variant, product.details)].image_url : undefined}" width=175>
					<div class="orderItem__info">
						<h4>${product.details.product_name}</h4>
						<span>Quantity:&nbsp;${product.quantity}</span>
						<span>Color:&nbsp;${product.variant}</span>
						<span>Size:&nbsp;${product.size}</span>
						${product.customization.length > 0 ? product.customization.map(a => `<span>${a.label}&nbsp;${a.value}</span>`.trim()).join('') : ``}
					</div>
					<span style="font-size: 32px;">$${product.details.price}</span>
				`;

				item.innerHTML = itemTemplate;
				$order_container.appendChild(item);
			}
		}

		$checkout_container.style.display = 'none';
		$pdp_container.style.display = 'none';
		$catalog_container.style.display = 'none';
		$order_container.style.display = 'block';
		scrollToTop();
	}

	function changeActiveVariant(variant) {
		var images = state.product.images;
		var newImages = [];
		for (var i = 0; i < images.length; i++) {
			var associations = images[i].associations;
			for (var j = 0; j < associations.length; j++) {
				if (associations[j].label === variant && associations[j].checked) {
					newImages.push(images[i]);
				}
			}
		}

		var thumbnailTemplate = `
			${newImages.map((image, i) => `
				<img onclick="Catalog.switchMainImageTo(this)" src="${image.image_url}" class="details__thumbnail">
			`.trim()).join('')}
		`
		d.getElementById('thumbnail_container').innerHTML = thumbnailTemplate;

		switchMainImageTo(newImages[0]);
	}

	function switchMainImageTo(img) {
		if (img.src !== undefined) {
			d.getElementById('main_image').src = img.src;
			var children = d.getElementById('thumbnail_container').children;
			for (var i = 0; i < children.length; i++) {
				var child = children[i];
				child.className = child.className.replace('active', '');
			}
			img.className += ' active';
		} else {
			//init case, pdp first visited
			d.getElementById('main_image').src = img.image_url;
			var children = d.getElementById('thumbnail_container').children;
			for (var i = 0; i < children.length; i++) {
				var child = children[i];
				child.className = child.className.replace('active', '');
			}
			children[0].className += ' active';
		}
	}

	function getActiveVariant() {
		return d.getElementById('variant').value;
	}

	function paintCatalog() {
		var catalog = d.getElementById('catalog');
		var anchor = d.createElement('div');
		anchor.className += 'row';
		var productList = state.products;

		if (state.filteredProducts) {
			productList = state.filteredProducts;
		}

		for (p in productList) {
			var product = productList[p];
			var el = d.createElement('div');
			el.className += 'col-xs-12 col-sm-6 col-lg-4 productCard';
			if (product.images.length > 0) {
				var template =
					`<a onclick="Catalog.openDetails('${product.product_id}')">
						<div class="row end-xs productPrice">
							$${product.price}
						</div>
						<div class="productImage">
							<img src="${product.images[0].image_url}">
						</div>
						<div class="productName">
							${product.product_name}
						</div>
					</a>`;
			} else {
				var template =
					`<a onclick="Catalog.openDetails('${product.product_id}')">
						<div class="row end-xs productPrice">
							$${product.price}
						</div>
						<div class="productImage">
							<img src="http://via.placeholder.com/350x350">
						</div>
						<div class="productName">
							${product.product_name}
						</div>
					</a>`;
			}
			
			el.innerHTML = template;
			anchor.appendChild(el);
		}
		catalog.innerHTML = '';
		catalog.appendChild(anchor);
	}

	function initHeaderAndFooter() {
		d.getElementById('headerImage').src = state.organization.image;
		d.getElementById('footer').innerHTML = '&copy; ' + (new Date()).getFullYear() + ' ' + state.organization.organization_name;
	}

	function setDocumentColorScheme() {
		 d.documentElement.style.setProperty(`--primary`, state.organization.primary_color);
		 d.documentElement.style.setProperty(`--secondary`, state.organization.secondary_color);
	}

	function initFilters() {
		if (state.categories.length <= 1) {
			d.getElementById('filters').style.display = 'none';
			return;
		}

		var filterContent = d.getElementById('filter_content');
		var anchor = d.createElement('ul');
		for (var c in state.categories) {
			var category = state.categories[c];
			var li = d.createElement('li');

			var checkbox = d.createElement('input');
			checkbox.value = category.category_id;
			checkbox.id = category.category_name;
			checkbox.type = 'checkbox';

			var label = d.createElement('label');
			label.htmlFor = checkbox.id;
			label.className = 'noselect';
			label.appendChild(d.createTextNode(category.category_name));

			li.appendChild(checkbox);
			li.appendChild(label);
			anchor.appendChild(li);
		}

		filterContent.appendChild(anchor);

		$('#filter_content ul li > input').on('change', (e) => {
			var category_ids = [];
			$('#filter_content ul li > input:checked').each(function(index, element) {
				category_ids.push(parseInt(element.value));
			});
			toggleCategory(category_ids);
		});
	}

	function create() {
		if (_init)
			return;

		fetch($catalogResource)
			.then((response) => {
				if (!response.ok) {
					console.log("Catalog Error")
		            throw Error(response.statusText);
		        }

			    return response.json();
			}).then((info) => {
				state.products = info[0];
				state.categories = info[1];
				state.organization = info[2][0];
				initHeaderAndFooter();
				setDocumentColorScheme();
				paintCatalog();
				initFilters();

				_init = true;
			}).catch((e) => {
				console.log('Catalog Error:', e);
			});
	}

	return {
		create: create,
		openDetails: openDetails,
		openCheckout: openCheckout,
		openCatalog: openCatalog,
		openOrderScreen: openOrderScreen,
		changeActiveVariant: changeActiveVariant,
		switchMainImageTo: switchMainImageTo,
		state: state
	};
})(document);