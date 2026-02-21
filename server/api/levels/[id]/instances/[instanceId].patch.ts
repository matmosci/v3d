export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const params = event.context.params || {};
  const id = params.id;
  const instanceId = params.instanceId;

  if (!id || !instanceId) {
    return createError({
      statusCode: 400,
      statusMessage: "Missing route params",
    });
  }

  const level = await LevelModel.findById(id);
  if (!level) {
    return createError({
      statusCode: 404,
      statusMessage: "Level not found",
    });
  }

  const instance = await InstanceModel.findOne({ _id: instanceId, level: id });
  if (!instance) {
    return createError({
      statusCode: 404,
      statusMessage: "Instance not found",
    });
  }

  const sessionUser = user as any;
  const userId = sessionUser.id || sessionUser._id;
  if (String(instance.user) !== String(userId)) {
    return createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  const body = await readBody(event);
  const update = {} as Record<string, number[]>;

  if (Array.isArray(body?.position) && body.position.length === 3) {
    update.position = body.position;
  }
  if (Array.isArray(body?.quaternion) && body.quaternion.length === 4) {
    update.quaternion = body.quaternion;
  }
  if (Array.isArray(body?.scale) && body.scale.length === 3) {
    update.scale = body.scale;
  }

  if (!Object.keys(update).length) {
    return createError({
      statusCode: 400,
      statusMessage: "No valid transform fields provided",
    });
  }

  const updated = await InstanceModel.findOneAndUpdate(
    { _id: instanceId, level: id },
    { $set: update },
    { new: true }
  ).select("-__v");

  return updated;
});
