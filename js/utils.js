function convert_objects_to_maps(object_array) {
	return object_array.map(object => {
        let keys = Object.keys(object);
		let map = new Map();
		for (let key of keys) {
			map.set(key, object[key]);
		}
        return map;
	})
}

function download_data(data_URL) {
    let request = new XMLHttpRequest();
    request.open("GET", data_URL, false);
    request.send();
    let raw_response = request.responseText;
    return JSON.parse(raw_response);
};
// Consider exploring use of
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Body

module.exports = {
    convert_objects_to_maps: convert_objects_to_maps,
    download_data: download_data
}
