function getOpenData() {
    var apiKey = "3b9602025c9b794ce85074a672a6e4f8"; // Paste your API key here. IMPORTANT: DO NOT PUSH THIS TO GITHUB, STORE KEY IN DB
    if (apiKey == "")
        return '{"error":"No Api Key! Add your key in the server script file."}';
    //'https://api.uwaterloo.ca/v2/buildings/cgr.json?key=' + uw_api_key,
    return proxy.GetProxy('https://api.uwaterloo.ca/v2/'+args.Get('endPoint')+'?key=' + apiKey);
}

function getOpenDataV1() {
    var apiKey = "3b9602025c9b794ce85074a672a6e4f8"; // Paste your API key here. IMPORTANT: DO NOT PUSH THIS TO GITHUB, STORE KEY IN DB
    if (apiKey == "")
        return '{"error":"No Api Key! Add your key in the server script file."}';
    //'https://api.uwaterloo.ca/v2/buildings/cgr.json?key=' + uw_api_key,
    return proxy.GetProxy("https://api.uwaterloo.ca/public/v1/?key=" + apiKey + "&" + args.Get('endPoint'));
}