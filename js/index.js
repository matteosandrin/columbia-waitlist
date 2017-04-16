$(document).ready(function() {
	$('#fullpage').fullpage({
		sectionsColor: ['#1bbc9b', '#4BBFC3', '#7BAABE', 'whitesmoke', '#20457C'],
		anchors: ['welcome', 'data', 'columbia', 'photography', 'attend'],
		scrollingSpeed: 500,
		navigation: true,
		autoScrolling: false,
		parallax: true
	});

});

window.addEventListener('keydown', function (key) {
	switch (key.keyCode) {
		case 38: $.fn.fullpage.moveSectionUp();		break; //arrow up
		case 40: $.fn.fullpage.moveSectionDown();	break; //arrow down
	}
});