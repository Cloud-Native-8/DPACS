export const accessDirectionLabels = {
  IN: "進入",
  OUT: "離開"
};

export const anomalyTypeLabels = {
  IN: "同進",
  OUT: "同出"
};

export const anomalyStatusLabels = {
  pending: "待確認",
  resolved: "已處理"
};

export const anomalyStatusOptions = Object.entries(anomalyStatusLabels).map(
  ([value, label]) => ({
    value,
    label
  })
);
