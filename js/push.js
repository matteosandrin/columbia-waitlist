if (window.location.host.search("localhost") == -1) {
	var payload = {
		"app_id": "d920c173-d56e-43cd-bb87-fe8e9b461602",
		"included_segments": ["All"],
		"template_id": "5f5a37de-5579-4eec-ba8f-6252c50757cb"
	}

	var request = new XMLHttpRequest();
	request.open('POST', "https://onesignal.com/api/v1/notifications", true);
	request.setRequestHeader("Content-Type", "application/json; charset=utf-8");
	request.setRequestHeader("Authorization", "Basic MjJhNzdlYWQtNzcyMS00OWEyLWJkNzUtMDljNDZmMzg1YzNm");
	request.send(JSON.stringify(payload));
}