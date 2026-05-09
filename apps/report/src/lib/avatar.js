export const getInitials = (name) =>
  name
    .split(" ")
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2);

const getHueFromText = (text) => {
  const hash = text.split("").reduce((sum, character) => {
    return sum + character.charCodeAt(0);
  }, 0);

  return hash % 360;
};

export const createAvatarStyle = (name) => {
  const hue = getHueFromText(name);

  return {
    backgroundColor: `hsl(${hue} 72% 90%)`,
    color: `hsl(${hue} 62% 34%)`
  };
};
