$(function () {
	var baseURL = "/api";
	var currPage = 1;
	var perPage = 30;
	var count = 0;
	var audio = new Audio();

	audio.onended = function () {
		$(".play-pause-button").removeClass("fa-pause-circle");
		$(".play-pause-button").addClass("fa-play-circle");
		$(".ayah-item").removeClass("playing");
	};

	initializerecitersList('ar');

	function initializerecitersList(lang) {
		$.getJSON("http://api.alquran.cloud/v1/edition?format=audio&language=" + lang, function (data) {
			var recitersList = [];
			$.each(data.data, function (key, val) {
				recitersList.push('<option value="' + val.identifier + '">' + JSON.stringify(val.name).slice(1, -1) + '</option>');
			});

			$("#recList").html(recitersList.join(""));
		});
	};

	function arNum(en) {
		return ("" + en).replace(/[0-9]/g, function (t) {
			return "٠١٢٣٤٥٦٧٨٩".substr(+t, 1);
		});
	}
	function renderTotalCount(count) {
		$("#count").append("عدد النتائج: " + arNum(count || 0));
	}
	function renderAyat(ayat) {
		for (var i = 0; i < ayat.length; i++) {
			var ayahText = ayat[i]["text"];
			var surahAndAyah = ayat[i]["ayah"];
			var path = ayat[i]["path"];
			ayatList =
				"<div class='ayah-item'><div class='pure-g'><span class='pure-u-1-2 ayah-title'>" +
				surahAndAyah +
				"</span><div class='pure-u-1-2 ayah-group'><a class='play-pause-button fas fa-play-circle' data-src=" +
				path +
				"></a>\t<a id='tooltip' class='tafsir tooltip fab fa-readme' data-src=" +
				path +
				"></a>\t<div id='tooltip' class='sharing tooltip fas fa-share-alt' data-src=" +
				path +
				"></div></div></div><li class='ayah-content'>" +
				ayahText +
				"</li></div>";
			$(".ayat").append(ayatList);
		}
		addPlayEvent();
		addTafsirEvent();
		addSharingEvent();

		$(document).click(function (e) {
			if (e.target.id === "tooltip") return;
			if ($(".tooltiptext").length) {
				$(".tooltip").empty();
				$(".tooltip").removeClass("active");
			}
		});
	}
	function renderPageBtn(page) {
		var activeClass = page === currPage ? "class ='active'" : "";
		return '<a id="' + page + '"' + activeClass + ">" + arNum(page) + "</a>";
	}
	function renderDotBtn() {
		return '<a class="dots">...</a>';
	}
	function renderPagination(count) {
		var pagination = $(".pagination");

		var firstPage = 1;
		var lastPage = Math.ceil(count / perPage);

		if (firstPage === lastPage) return;

		var atStarting = currPage - 3 <= firstPage;
		var atEnding = currPage + 3 >= lastPage;

		if (atStarting && atEnding) {
			for (var i = firstPage; i <= lastPage; i++) {
				pagination.append(renderPageBtn(i));
			}
		} else if (atStarting) {
			for (var i = 1; i <= 5; i++) {
				pagination.append(renderPageBtn(i));
			}
			pagination.append(renderDotBtn());
			pagination.append(renderPageBtn(lastPage));
		} else if (atEnding) {
			pagination.append(renderPageBtn(firstPage));
			pagination.append(renderDotBtn());
			for (var i = lastPage - 4; i <= lastPage; i++) {
				pagination.append(renderPageBtn(i));
			}
		} else {
			pagination.append(renderPageBtn(firstPage));
			pagination.append(renderDotBtn());
			for (var i = currPage - 2; i <= currPage + 1; i++) {
				pagination.append(renderPageBtn(i));
			}
			pagination.append(renderDotBtn());
			pagination.append(renderPageBtn(lastPage));
		}

		handlePageClick();
	}
	function handlePageClick() {
		$(".pagination a:not(.dots)").on("click", function (e) {
			var pageNum = e.target.id;
			currPage = parseInt(pageNum);
			var searchText = $("#search-ayah").val();
			$("html, body").animate(
				{
					scrollTop: $("#search-ayah").offset().top,
				},
				200
			);
			searchAyah(searchText);
		});
	}
	function searchAyah(s) {
		$.ajax({
			type: "GET",
			url: baseURL + "/search?s=" + s + "&page=" + currPage + "&perPage=" + perPage,
			dataType: "json",
			success: function (response) {
				$("#count").empty();
				$(".ayat").empty();
				$(".pagination").empty();
				audio.pause();
				renderTotalCount(response.count);
				if (response.count > 0) {
					count = response.count;
					$(".ayat").attr("start", (currPage - 1) * perPage + 1);
					renderAyat(response.result);
					renderPagination(response.count);
				}
			},
		});
	}
	function getTafsir(path, cb) {
		$.ajax({
			type: "GET",
			url: baseURL + "/tafsir" + path,
			dataType: "json",
			success: function (response) {
				cb(response);
			},
		});
	}
	function addPlayEvent() {
		$(".play-pause-button").on("click", function () {
			var datasrc = $(this).attr("data-src");
			$(".play-pause-button")
				.not(this)
				.each(function () {
					$(this).removeClass("fa-pause-circle");
					$(this).addClass("fa-play-circle");
				});
			audio.pause();
			$(".ayah-item").removeClass("playing");
			if ($(this).hasClass("fa-play-circle")) {
				var selectedRec = $("#recList").val();

				audio.src = baseURL+"/audio/"+selectedRec+datasrc;
				$(this).removeClass("fa-play-circle");
				$(this).addClass("fa-pause-circle");
				audio.play();
				$(this).closest(".ayah-item").addClass("playing");
			} else {
				$(this).removeClass("fa-pause-circle");
				$(this).addClass("fa-play-circle");
				$(this).closest(".ayah-item").removeClass("playing");
			}
		});
	}
	function addTafsirEvent() {
		$(".tafsir").click(function () {
			var elm = $(this);
			if (elm.hasClass("active")) {
				elm.removeClass("active");
				elm.empty();
			} else {
				$(".tooltip").empty();
				$(".tooltip").removeClass("active");
				elm.addClass("active");
				var datasrc = elm.attr("data-src");
				getTafsir(datasrc, function (result) {
					var text = result.text;
					var tip = "<span class='tooltiptext'>" + text + "</span>";
					elm.append(tip);
					elm.on("click", "span", function (e) {
						e.stopPropagation();
					});
				});
			}
		});
	}
	function addSharingEvent() {
		$(".sharing").click(function () {
			var elm = $(this);
			if (elm.hasClass("active")) {
				elm.removeClass("active");
				elm.empty();
			} else {
				$(".tooltip").empty();
				$(".tooltip").removeClass("active");
				elm.addClass("active");

				var searchText = $("#search-ayah").val();

				var url = window.location.origin + "/?s=" + searchText + "&page=" + currPage + "&perPage=" + perPage;
				var text = "{ " + $(this).closest(".ayah-item").children(".ayah-content").text().trim() + " } " + $(this).closest(".ayah-item").children().children(".ayah-title").text();
				var fb_note = count > 1 ? "يوجد " + arNum(count - 1) + " آيات اخرى ورد فيها " + '"' + searchText + '" على www.lookquran.com' : "يمكنك البحث عن الآية والتفسير على lookquran.com";
				var note = count > 1 ? "يوجد " + arNum(count - 1) + " آيات اخرى ورد فيها " + '"' + searchText + '" على www.lookquran.com/?s=' + encodeURIComponent(searchText) : "يمكنك البحث عن الآية والتفسير على lookquran.com";

				var fb = "'https://www.facebook.com/sharer/sharer.php?u=" + url + "&quote=" + encodeURIComponent(text + "\n" + fb_note) + "'";
				var twitter = "'https://twitter.com/intent/tweet?url=" + url + "&text=" + encodeURIComponent(text) + "'";
				var whatsapp = "'https://wa.me/?text=" + encodeURIComponent(text + "\n" + note) + "'";

				elm.append(
					"<div class='social-links-demo tooltiptext'><a href=" +
					fb +
					" title='شارك على فيسبوك' target='popup' onclick=\"window.open(" +
					fb +
					",'popup','width=600,height=600,scrollbars=no,resizable=no')\"><i class='fab fa-facebook-square'></i></a><a href=" +
					twitter +
					" title='غرّد' target='popup' onclick=\"window.open(" +
					twitter +
					",'popup','width=600,height=600,scrollbars=no,resizable=no')\"><i class='fab fa-twitter-square'></i></a><a href=" +
					whatsapp +
					" title='ارسل على الواتساب' target='popup' onclick=\"window.open(" +
					whatsapp +
					",'popup','width=600,height=600,scrollbars=no,resizable=no')\"><i class='fab fa-whatsapp-square'></i></a></div>"
				);

				elm.on("click", "div", function (e) {
					e.stopPropagation();
				});
			}
		});
	}
	function getRandomAya() {
		var ayat = ["صوم", "الربا", "محمد", " اكثر الناس لا", "قرانا عربيا", "توبة", "ربنا لا", "الصبر", "عسى ان ينفعنا", "لا خوف عليهم ولا هم يحزنون"];
		var aya = ayat[Math.floor(Math.random() * ayat.length)];
		$("#search-ayah").val(aya).focus().keyup();
	}

	$("#search-ayah").keyup(function () {
		var searchText = $("#search-ayah").val();
		if (searchText) {
			currPage = 1;
			searchAyah(searchText);
		}
	});

	$("#search-ayah").keypress(function (e) {
		if (e.keyCode == 13) {
			e.target.blur();
		}
	});

	if (window.location.search) {
		var queryParam = false;
		var keys = window.location.search.split("?")[1].split("&");
		keys
			.map(function (k) {
				return k.split("=");
			})
			.forEach(function (e) {
				if (e[0] === "page") {
					currPage = e[1];
				} else if (e[0] === "perPage") {
					perPage = e[1];
				} else if (e[0] === "s") {
					queryParam = true;
					var s = decodeURI(e[1]);
					$("#search-ayah").val(s).focus().keyup();
					var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?";
					window.history.pushState({ path: newurl }, "", newurl);
				}
			});
		if (!queryParam) getRandomAya();
	} else {
		getRandomAya();
	}
});
