export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const params = event.context.params || {};
  const id = params.id;

  if (!id) {
    return createError({
      statusCode: 400,
      statusMessage: "Missing entity id",
    });
  }

  const entity = await EntityModel.findById(id);
  if (!entity) {
    return createError({
      statusCode: 404,
      statusMessage: "Entity not found",
    });
  }

  const sessionUser = user as any;
  const userId = sessionUser.id || sessionUser._id;
  if (String(entity.user) !== String(userId)) {
    return createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  const body = await readBody(event);
  const thumbnail = typeof body?.thumbnail === "string" ? body.thumbnail : "";

  if (!thumbnail.startsWith("data:image/")) {
    return createError({
      statusCode: 400,
      statusMessage: "Invalid thumbnail payload",
    });
  }

  entity.thumbnail = thumbnail;
  await entity.save();

  return { thumbnail: entity.thumbnail };
});