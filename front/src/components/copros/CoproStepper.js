// CoproStepper.js
import React from 'react';
import { Stepper, Step, StepLabel } from '@mui/material';

const CoproStepper = ({ activeStep, steps, connector, StepIconComponent }) => {
  return (
    <Stepper alternativeLabel activeStep={activeStep} connector={connector}>
      {steps.map((label, index) => (
        <Step key={index}>
          <StepLabel StepIconComponent={StepIconComponent}>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

export default CoproStepper;