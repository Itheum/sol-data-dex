import React, { useState, useEffect } from "react";
import { Box, Text } from "@chakra-ui/react";
import { useAccountStore } from "store/account";

interface CountdownProps {
  unixTime: number;
}

const Countdown: React.FC<CountdownProps> = ({ unixTime }) => {
  const { updateCooldown } = useAccountStore();

  const calculateTimeLeft = () => {
    const difference = (unixTime - Date.now()) / 1000;

    let timeLeft = {
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor(difference / 3600),
        minutes: Math.floor((difference % 3600) / 60),
        seconds: Math.floor(difference % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [unixTime]); // Make sure to run the effect whenever unixTime changes

  useEffect(() => {
    if (timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
      // update the cooldown to 0, so that the animation appears on the icons
      updateCooldown(0);
    }
  }, [timeLeft]);

  return (
    <Box>
      {timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0 ? (
        <span> Claim Your {`BiTz`} XP</span>
      ) : (
        <Text>
          Play again in {timeLeft.hours > 0 ? <>{`${timeLeft.hours} ${timeLeft.hours === 1 ? " Hour " : " Hours "}`}</> : ""}
          {timeLeft.minutes > 0 ? timeLeft.minutes + " Min " : ""} {timeLeft.seconds} Sec
        </Text>
      )}
    </Box>
  );
};

export default Countdown;
