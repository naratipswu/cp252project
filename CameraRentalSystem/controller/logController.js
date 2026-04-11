const { SyncLog } = require('../../models');

exports.showAdminLogs = async (req, res) => {
    try {
        const logs = await SyncLog.findAll({
            order: [['SyncedAt', 'DESC']],
            limit: 100
        });

        res.render('admin_logs', {
            user: req.session.user,
            logs: logs.map(log => ({
                id: log.SyncLogID,
                source: log.Source,
                status: log.Status,
                message: log.Message,
                syncedAt: log.SyncedAt
            }))
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).send('Failed to load system logs dashboard');
    }
};
