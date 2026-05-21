const Content = require("../models/Content");

const getContents = async (req, res) => {
  try {
    const { batch } = req.query;
    let query = {};
    if (batch) {
      query.batch = batch;
    }
    const contents = await Content.find(query).sort({ createdAt: -1 }).populate("uploadedBy", "name");
    
    res.json({
      success: true,
      data: contents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load study materials",
    });
  }
};

const createContent = async (req, res) => {
  const { role, assignedBatches } = req.user;

  // Only admins and teachers can upload
  if (role !== "admin" && role !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "Only administrators or teachers can upload study materials",
    });
  }

  const { title, description, materialType, fileUrlOrLink, batch, subject, chapter } = req.body;

  if (!title || !materialType || !fileUrlOrLink || !batch || !subject) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be provided",
    });
  }

  // Teachers may only upload to their own assigned batches
  if (role === "teacher" && !assignedBatches.includes(batch.trim())) {
    return res.status(403).json({
      success: false,
      message: `You are not assigned to batch "${batch}". You can only upload to: ${assignedBatches.join(", ") || "none"}`,
    });
  }

  try {
    const newContent = await Content.create({
      title: title.trim(),
      description: description?.trim(),
      materialType,
      fileUrlOrLink: fileUrlOrLink.trim(),
      batch: batch.trim(),
      subject: subject.trim(),
      chapter: chapter?.trim() || '',
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Study material uploaded successfully",
      data: newContent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload study material",
    });
  }
};

const deleteContent = async (req, res) => {
  const { role, _id: userId } = req.user;

  // Teachers can only delete their own uploads; admins can delete anything
  if (role !== "admin" && role !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "Only administrators or teachers can delete study materials",
    });
  }

  const { id } = req.params;

  try {
    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Study material not found",
      });
    }

    // Teachers may only delete content they personally uploaded
    if (role === "teacher" && String(content.uploadedBy) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete study materials that you uploaded",
      });
    }

    await Content.deleteOne({ _id: id });

    res.json({
      success: true,
      message: "Study material deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete study material",
    });
  }
};

module.exports = { getContents, createContent, deleteContent };
