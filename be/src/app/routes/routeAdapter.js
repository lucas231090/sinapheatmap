function routeAdapter(controllerAuth) {
  return async (request, response) => {
    const result = await controllerAuth.handle({ body: request.body });
    response.status(result.statusCode).json(result.body);
  };
}

module.exports = routeAdapter;
