const scriptService = require('../services/scriptService');

// Update the script status
exports.updateScriptStatus = async (req, res) => {
  const { scriptName, status } = req.body;

  try {
    const result = await scriptService.updateScriptStatus(scriptName, status);
    res.status(200).json({
      message: 'Script status updated successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update script status',
      error: error.message,
    });
  }
};

// Get all script logs
exports.getScriptStateLogs = async (req, res) => {
  try {
    const logs = await scriptService.getScriptStateLogs();
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch script logs',
      error: error.message,
    });
  }
};

// Log when the script starts
exports.logScriptStart = async (req, res) => {
  const { scriptName } = req.body;

  try {
    const logId = await scriptService.logScriptStart(scriptName);
    res.status(200).json({
      message: 'Script started successfully',
      logId,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to start script',
      error: error.message,
    });
  }
};

// Update the log entry for a script
exports.updateLogStatus = async (req, res) => {
  const { scriptName, logId, status, message } = req.body;

  try {
    const result = await scriptService.updateLogStatus(scriptName, logId, status, message);
    res.status(200).json({
      message: 'Log entry updated successfully',
      logId: result,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update log entry',
      error: error.message,
    });
  }
};

// Sync function
exports.getListScripts = async (req, res) => {
  try {
    await scriptService.getListScripts(req, res);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to getListScripts scripts',
      error: error.message,
    });
  }
};