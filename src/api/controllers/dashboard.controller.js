const CustomerSupportTicket = require("../models/tickets.model");

const ticketStatics = async (req, res) => {
  try {
    // Extract filter parameters from query
    const {
      period = "currentDay", // Default to 'currentDay' if no period is specified
      startDate,
      endDate,
    } = req.query;

    // Determine the date range based on the period
    let dateFilter = {};
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    now.setHours(23, 59, 59, 999);
    const endOfToday = now;

    switch (period) {
      case "currentDay":
        dateFilter = { createdAt: { $gte: startOfToday, $lte: endOfToday } };
        break;
      case "previousDay":
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(endOfToday);
        endOfYesterday.setDate(endOfYesterday.getDate() - 1);
        dateFilter = {
          createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
        };
        break;
      case "currentWeek":
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        dateFilter = { createdAt: { $gte: startOfWeek, $lte: endOfToday } };
        break;
      case "previousWeek":
        const startOfLastWeek = new Date(startOfToday);
        startOfLastWeek.setDate(
          startOfLastWeek.getDate() - startOfLastWeek.getDay() - 7
        );
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
        dateFilter = {
          createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek },
        };
        break;
      case "currentMonth":
        const startOfMonth = new Date(
          startOfToday.getFullYear(),
          startOfToday.getMonth(),
          1
        );
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfToday } };
        break;
      case "previousMonth":
        const startOfLastMonth = new Date(
          startOfToday.getFullYear(),
          startOfToday.getMonth() - 1,
          1
        );
        const endOfLastMonth = new Date(startOfLastMonth);
        endOfLastMonth.setMonth(endOfLastMonth.getMonth() + 1);
        endOfLastMonth.setDate(0);
        dateFilter = {
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        };
        break;
      case "custom":
        if (!startDate || !endDate) {
          return res
            .status(400)
            .json({
              error:
                "For custom date range, both startDate and endDate are required.",
            });
        }
        dateFilter = {
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        };
        break;
      default:
        // If 'all' or invalid period, default to current day
        dateFilter = { createdAt: { $gte: startOfToday, $lte: endOfToday } };
    }

    const stats = await CustomerSupportTicket.aggregate([
      {
        $match: dateFilter,
      },
      {
        $facet: {
          totalTickets: [{ $count: "count" }],
          totalClosedTickets: [
            { $match: { status: "close" } },
            { $count: "count" },
          ],
          totalOpenTickets: [
            { $match: { status: "Open" } },
            { $count: "count" },
          ],
          totalPendingTickets: [
            { $match: { status: "Open" } },
            { $count: "count" },
          ],
          totalUnassignedTickets: [
            { $match: { $or: [{ assignedTo: null }, { assignedTo: "" }] } },
            { $count: "count" },
          ],
          averageCloseTime: [
            { $match: { status: "Close" } },
            {
              $group: {
                _id: null,
                avgCloseTime: {
                  $avg: {
                    $subtract: ["$updatedAt", "$createdAt"],
                  },
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          totalTickets: { $arrayElemAt: ["$totalTickets.count", 0] },
          totalClosedTickets: {
            $arrayElemAt: ["$totalClosedTickets.count", 0],
          },
          totalOpenTickets: { $arrayElemAt: ["$totalOpenTickets.count", 0] },
          totalPendingTickets: {
            $arrayElemAt: ["$totalPendingTickets.count", 0],
          },
          totalUnassignedTickets: {
            $arrayElemAt: ["$totalUnassignedTickets.count", 0],
          },
          averageCloseTime: {
            $cond: {
              if: { $gt: [{ $size: "$averageCloseTime" }, 0] },
              then: { $arrayElemAt: ["$averageCloseTime.avgCloseTime", 0] },
              else: null,
            },
          },
        },
      },
    ]);

    const statistics = stats[0];

    res.json({
      totalTickets: statistics.totalTickets || 0,
      totalClosedTickets: statistics.totalClosedTickets || 0,
      totalOpenTickets: statistics.totalOpenTickets || 0,
      totalPendingTickets: statistics.totalPendingTickets || 0,
      totalUnassignedTickets: statistics.totalUnassignedTickets || 0,
      averageCloseTime: statistics.averageCloseTime
        ? statistics.averageCloseTime / (1000 * 60 * 60) // Convert milliseconds to hours
        : 0, // in hours
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching ticket statistics" });
  }
};

module.exports = ticketStatics;
