if (window.location.host.search("localhost") == -1) {

	var payload = {
		"app_id": "d920c173-d56e-43cd-bb87-fe8e9b461602",
		"included_segments": ["All"],
		"contents":{ "en": "" }
	}

	$.getJSON("http://freegeoip.net/json/", function (ip_data) {

		payload.contents.en = "Someone's looking at your website from " + ip_data.city + ", " + ip_data.country_name;

        $.ajax({
        	url: "https://onesignal.com/api/v1/notifications",
        	type: "post",
        	data: JSON.stringify(payload),
        	headers: {
        		"Content-Type": "application/json; charset=utf-8",
        		"Authorization": "Basic MjJhNzdlYWQtNzcyMS00OWEyLWJkNzUtMDljNDZmMzg1YzNm"
        	}
        });
    });
}