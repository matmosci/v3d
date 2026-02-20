export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody(event);
  const { id } = event.context.params;

  const level = await LevelModel.findById(id);
  if (!level) {
    return createError({
      statusCode: 404,
      statusMessage: "Level not found",
    });
  };

  const instance = await InstanceModel.create({
    level: id,
    asset: body.asset,
    user: user.id,
    position: Array.isArray(body.position) ? body.position : [0, 0, 0],
    quaternion: Array.isArray(body.quaternion) ? body.quaternion : [0, 0, 0, 1],
    scale: Array.isArray(body.scale) ? body.scale : [1, 1, 1],
  });

  return instance;
});
