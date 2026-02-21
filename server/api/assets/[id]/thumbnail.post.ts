export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const params = event.context.params || {};
  const id = params.id;

  if (!id) {
    return createError({
      statusCode: 400,
      statusMessage: "Missing asset id",
    });
  }

  const asset = await AssetModel.findById(id);
  if (!asset) {
    return createError({
      statusCode: 404,
      statusMessage: "Asset not found",
    });
  }

  const sessionUser = user as any;
  const userId = sessionUser.id || sessionUser._id;
  if (String(asset.user) !== String(userId)) {
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

  asset.thumbnail = thumbnail;
  await asset.save();

  return { thumbnail: asset.thumbnail };
});
