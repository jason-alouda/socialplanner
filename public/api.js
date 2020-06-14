let API_URL = "/api";

const apiRequest = async (method, path, body = null) => {

  let data;
  let res;
  let actual_body = null;
  if (body !== null) {
    actual_body = JSON.stringify(body)
  }
  let opts = {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: actual_body
  };

  try {
    if (method === "GET") {
      res = await fetch(API_URL + "/" + path);
    } else {
      res = await fetch(API_URL + "/" + path, opts);
    }
    data = await res.json();
  } catch (e) {
    alert(e.message);
    throw e;
  }

  console.log(res.status, data);
  return [res.status, data];
};

window.apiRequest = apiRequest;
export default apiRequest;
