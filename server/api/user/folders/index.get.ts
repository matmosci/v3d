export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    // Get all folders for the user
    const folders = await FolderModel.find({ 
        user: user.id, 
        deletedAt: null 
    }).select("-user -__v").sort({ createdAt: 1 }).lean();

    return folders;
});