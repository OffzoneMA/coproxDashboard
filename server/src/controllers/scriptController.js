const ScriptService = require('../services/scriptService');

class ScriptController {
  static async sendResponse(res, operation) {
    try {
      const data = await operation();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error(`Operation failed: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async addScript(req, res) {
    try {
      const { 
        scriptName, 
        scriptContent,
        label,
        endpoint,
        description,
        category,
        priority,
        timeout,
        maxRetries,
        scriptOptions,
        notifyOnError,
        notifyOnSuccess
      } = req.body;
      
      // Validate required fields
      if (!scriptName || !scriptContent) {
        return res.status(400).json({
          success: false,
          error: 'Script name and content are required'
        });
      }

      // Pass optional parameters
      const options = {
        label,
        endpoint,
        description,
        category,
        priority,
        timeout,
        maxRetries,
        scriptOptions,
        notifyOnError,
        notifyOnSuccess
      };

      const result = await ScriptService.addScript(scriptName, scriptContent, options);
      return res.status(201).json({ 
        success: true, 
        data: result,
        message: result.message || 'Script added successfully'
      });
    } catch (error) {
      console.error(`Add script failed: ${error.message}`);
      
      // Provide more specific error status codes
      const statusCode = error.message.includes('already exists') ? 409 : 
                         error.message.includes('syntax') ? 400 : 500;
      
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  static async updateScriptStatus(req, res) {
    const { scriptName, status, option } = req.body;
    return ScriptController.sendResponse(res, () => 
      ScriptService.updateScriptStatus(scriptName, status, option)
    );
  }

  static async getScriptStateLogs(req, res) {
    return ScriptController.sendResponse(res, () => 
      ScriptService.getScriptStateLogs()
    );
  }

  static async logScriptStart(req, res) {
    const { scriptName, option } = req.body;
    return ScriptController.sendResponse(res, () => 
      ScriptService.logScriptStart(scriptName, option)
    );
  }

  static async updateLogStatus(req, res) {
    const { scriptName, logId, status, message, apiCalls } = req.body;
    return ScriptController.sendResponse(res, () => 
      ScriptService.updateLogStatus(scriptName, logId, status, message, apiCalls)
    );
  }

  static async getListScripts(req, res) {
    return ScriptController.sendResponse(res, () => 
      ScriptService.getListScripts()
    );
  }

  static async getScriptsDashboardView(req, res) {
    return ScriptController.sendResponse(res, () => 
      ScriptService.getScriptsDashboardView()
    );
  }

  static async cleanupStaleScripts(req, res) {
    try {
      // Get limit from query params (default: 50 for timeout safety)
      const limit = parseInt(req.query.limit) || 50;
      
      // Set timeout warning (serverless functions have limited time)
      const timeoutWarning = setTimeout(() => {
        console.warn('Cleanup operation taking longer than expected');
      }, 25000); // Warn after 25 seconds
      
      const result = await ScriptService.markStaleInProgressScriptsAsFailed(limit);
      clearTimeout(timeoutWarning);
      
      return res.status(200).json({ 
        success: true, 
        data: result,
        message: result.hasMore 
          ? `Processed ${result.processed} scripts. ${result.remaining} more need processing. Call again to continue.`
          : 'All stale scripts have been cleaned up.'
      });
    } catch (error) {
      console.error(`Cleanup stale scripts failed: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: error.message,
        hint: 'Try using ?limit=25 for smaller batches if timeout occurs'
      });
    }
  }

  static async cleanupAllInProgressScripts(req, res) {
    return ScriptController.sendResponse(res, () => 
      ScriptService.markAllInProgressScriptsAsFailed()
    );
  }

  static async resetAllScriptsToSuccess(req, res) {
    return ScriptController.sendResponse(res, () => 
      ScriptService.resetAllScriptsToSuccess()
    );
  }
}

module.exports = ScriptController;