import PropTypes from "prop-types";

export const timeValuePropType = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.instanceOf(Date),
]);

export const recentEventShape = PropTypes.shape({
  eventId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  userId: PropTypes.string,
  doorId: PropTypes.string,
  factoryId: PropTypes.string,
  decision: PropTypes.string,
  direction: PropTypes.string,
  time: PropTypes.string,
});

export const reportShape = PropTypes.shape({
  generatedAt: PropTypes.string,
  summary: PropTypes.shape({
    activeEmployees: PropTypes.number,
    checkedInToday: PropTypes.number,
    pendingReviews: PropTypes.number,
  }),
  recentEvents: PropTypes.arrayOf(recentEventShape),
});

export const dateRangeShape = PropTypes.shape({
  start: PropTypes.string,
  end: PropTypes.string,
});

export const departmentShape = PropTypes.shape({
  departmentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  departmentName: PropTypes.string,
});

export const stayHourDistributionShape = PropTypes.shape({
  employeeCount: PropTypes.number,
  dailyAverages: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string,
      averageStayHours: PropTypes.number,
      activeEmployeeCount: PropTypes.number,
      employeeCount: PropTypes.number,
    }),
  ),
});

export const accessLogShape = PropTypes.shape({
  logId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  eventTime: timeValuePropType,
  direction: PropTypes.string,
  result: PropTypes.string,
  reason: PropTypes.string,
  status: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string,
    PropTypes.number,
  ]),
  employeeName: PropTypes.string,
});

export const deniedAccessDetailShape = PropTypes.shape({
  deniedAccessLog: accessLogShape,
  dailyAccessSequence: PropTypes.arrayOf(accessLogShape),
});

export const employeeAccessEventShape = PropTypes.shape({
  logId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  eventTime: timeValuePropType,
  direction: PropTypes.string,
  siteName: PropTypes.string,
  accessPointName: PropTypes.string,
  result: PropTypes.string,
  note: PropTypes.string,
});

export const employeeAccessRecordShape = PropTypes.shape({
  date: PropTypes.string,
  workingHours: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  overtimeHours: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  accessEvents: PropTypes.arrayOf(employeeAccessEventShape),
});
