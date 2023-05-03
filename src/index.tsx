import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'
import { ZIndices } from './ZIndices';
import { localized_strings } from './strings';
import { numbers } from './numbers';
import { constants } from './constants';
import { ChangeEventHandler } from 'react';
import retryify from 'fetch-retry'

const fetchWithRetries = retryify(fetch);


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

function useDebounce<T>(initialValue: T, delay: number) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValueImmediate] = useState(initialValue);
  const [intermediateValue, setIntermediateValue] = useState(debouncedValue);
  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValueImmediate(intermediateValue);
      }, delay);
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [intermediateValue, delay] // Only re-call effect if value or delay changes
  )
  return { value: debouncedValue, setDebouncedValueImmediate, setDebouncedValue: setIntermediateValue };
}


type EnumDictionary<T extends string | symbol | number, U> = {
  [K in T]: U;
};

interface WaitlistContainerProps {
  children: React.ReactNode
}

function WaitlistContainer({ children }: WaitlistContainerProps) {
  return <div>{children}</div>
}




enum SignUpState {
  HOME,
  FORM,
  THANKS
}


function TitleBanner() {
  return (
    <div style={{
      display: "flex",
      alignSelf: 'center',
      flexDirection: 'column',
      userSelect: 'none',
    }}>
      <p style={{
        color: "white",
        margin: 0,
        fontStyle: "italic",
        fontWeight: 400,
        fontSize: 25,
        marginBottom: -30,
      }}
      >{localized_strings.welcomeTo}</p>
      <p style={{
        color: "white",
        margin: 0,
        fontSize: 128,
      }}
      >{localized_strings.VotoTitle}</p>
    </div>

  )
}



const ctaButtonSize = {
  "m": {
    fontSize: 30,
    height: 60,
  },
  "s": {
    fontSize: 30,
    height: 40,
  }
}

interface CtaButtonProps {
  title: string
  size: keyof typeof ctaButtonSize
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void,
}

function CtaButton({ title, size, onPress, disabled, isLoading }: CtaButtonProps) {

  const [isHovering, setIsHovering] = useState(false)
  const [scale, setScale] = useState(1)
  const [opacity, setOpacity] = useState(1)


  const onMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const onMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [])
  useEffect(() => {
    if (disabled) {
      return
    }
    if (isHovering) {
      setScale(1.05)
    } else {
      setScale(1.0)
    }

  }, [isHovering, disabled])


  const onClick = useCallback(() => {
    if (disabled) {
      return
    }
    setOpacity(0.8)
    onPress()
  }, [onPress, disabled])
  const { fontSize, height } = ctaButtonSize[size]

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        margin: 0,
        backgroundColor: 'white',
        transform: `scale(${scale})`,
        opacity: disabled ? 0.8 : opacity,
        cursor: disabled ? 'default' : 'pointer',
        fontSize,
        height,
        color: 'black',
        border: 0,
        fontFamily: constants.fontFamily,
        width: '100%',
        borderRadius: numbers.CTA_BUTTON_BORDER_RADIUS,
      }}
    >{isLoading ? <SpinnerCicle /> : title}
    </button>
  )

}

interface ExplainerTextProps {
  text: string
}
function ExplainerText({ text }: ExplainerTextProps) {
  return <p style={{
    fontSize: 25,
    userSelect: 'none',
    color: 'white',
  }}
  >{text}</p>
}



export function Home({ onNext }: PageProp) {
  return (
    <div style={{
      height: '70%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minWidth: 340,
      marginBottom: 80,
    }}>
      <TitleBanner />
      <ExplainerText text={localized_strings.explainer} />
      <CtaButton onPress={onNext} size='m' title={localized_strings.waitlistCta} />
    </div>
  )
}

const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/


interface EmailInputGroupProps {
  setIsEmailValid: (x: boolean) => void
  setEmailInput: (x: string) => void
}

function EmailInputGroup({ setIsEmailValid, setEmailInput: setParentEmailInput }: EmailInputGroupProps) {
  const [emailInput, setEmailInput] = useState("")
  const { value: emailStatus, setDebouncedValue: setDebouncedEmailStatus,
    setDebouncedValueImmediate: setEmailStatus } =
    useDebounce(StatusIndicatorState.Disabled, 100)

  const onChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    setEmailInput(e.target.value)
    setEmailStatus(StatusIndicatorState.Processing)
    setDebouncedEmailStatus(StatusIndicatorState.Processing)
  }, [setEmailInput])

  useEffect(() => {
    setParentEmailInput(emailInput);
  }, [emailInput, setParentEmailInput])

  useEffect(() => {
    if (emailStatus === StatusIndicatorState.Disabled) {
      return
    }
    const isValidEmail = emailInput.match(emailRegex) !== null
    if (isValidEmail) {
      setDebouncedEmailStatus(StatusIndicatorState.Good)
    } else {
      setDebouncedEmailStatus(StatusIndicatorState.Error)
    }
  }, [emailInput, emailStatus])

  useEffect(() => {
    setIsEmailValid(emailStatus === StatusIndicatorState.Good)
  }, [emailStatus])


  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
    <p
      style={{
        color: 'white',
        fontSize: 25,
        margin: 0,
      }}
    >{localized_strings.emailAsk}</p>
    <div style={{
      display: 'flex',
      flexDirection: 'row'
    }}>
      <input
        spellCheck={false}
        onChange={onChange}
        autoComplete='email'
        placeholder={localized_strings.emailPlaceholder}
        style={{
          outline: 0,
          border: 0,
          color: 'white',
          borderRadius: numbers.CTA_BUTTON_BORDER_RADIUS,
          fontFamily: constants.fontFamily,
          paddingLeft: 10,
          paddingRight: 10,
          width: '20%',
          flex: 1,
          paddingTop: 5,
          paddingBottom: 5,
          fontSize: 24,
          backgroundColor: 'rgba(255,255,255,0.25)'
        }}
        type='email' />
      <StatusIndicator status={emailStatus} />
    </div>
  </div>)
}

function WaitlistSignupTitle() {
  return (<p style={{
    fontSize: 45,
    userSelect: 'none',
    margin: 0,
    color: 'white'
  }}
  >{localized_strings.waitlistSignupTitle}</p>)
}


enum StatusIndicatorState {
  Disabled,
  Processing,
  Error,
  Good,
}

const statusIndicatorColorMapper: EnumDictionary<StatusIndicatorState, string> = {
  [StatusIndicatorState.Disabled]: "rgba(255,255,255,0.25)",
  [StatusIndicatorState.Processing]: "#FFF3D2",
  [StatusIndicatorState.Error]: "#A62307",
  [StatusIndicatorState.Good]: "#208c31"
}

interface StatusIndicatorProps {
  status: StatusIndicatorState
}

function StatusIndicator({ status }: StatusIndicatorProps) {
  const fill = statusIndicatorColorMapper[status]
  return <svg style={{
    width: 50,
    height: 50,
  }}
    viewBox='0 0 100 100'><circle cx={50} cy={50} r={30} fill={fill} /></svg>
}

function SpinnerCicle() {
  return <div style={{
    width: 18,
    height: 18,
  }} className="spinner-circle" />
}



function WaitlistForm({ onNext }: PageProp) {
  const [isNextDisabled, setNextDisabled] = useState(true);
  const email = useRef<string | null>(null)

  const setEmailInput = useCallback((newEmail: string) => {
    email.current = newEmail
  }, [email])

  const setIsEmailValid = useCallback((isValid: boolean) => {
    setNextDisabled(!isValid)
  }, [setNextDisabled])

  const [isLoading, setIsLoading] = useState(false)

  const onPress = useCallback(async () => {
    if (isNextDisabled) {
      return
    }
    setIsLoading(true)
    try {
      let response = await fetchWithRetries("https://voto.api.mpbell.dev/waitlist/request-waitlist-spot", {
        method: "POST",
        body: JSON.stringify({ email: email.current }),
        retries: 5,
        retryDelay: 800,
        mode: 'cors',
        retryOn: (attempt, error, response) => response?.status === 502
      })
      if (response.status == 200) {
        // success!
        onNext()
      } else if (response.status === 409) {
        window.alert(`${email.current} is already registered. Please try again.`)
      } else if (response.status === 502) {
        // can probably retry
        window.alert(`Please contact voto@mpbell.dev immediately. Failed to signup despite retries.`)
      } else {
        window.alert(`Please contact voto@mpbell.dev immediately. Found an unexpected status. ${response.status}`)
      }
    } catch (e) {
      window.alert(`Please contact voto@mpbell.dev immediately for resolution.  Error Occurred: ${e}`)
    }
    setIsLoading(false)

  }, [isNextDisabled])

  return (
    <div style={{
      // height: '50%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: 400,
      marginTop: 'auto',
      marginBottom: 'auto',
    }}>
      <WaitlistSignupTitle />
      <div style={{
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        marginTop: 20,
        backgroundColor: 'rgba(60,60,60,0.2)',
        borderRadius: numbers.CTA_BUTTON_BORDER_RADIUS,
        gap: 30
      }}>

        <EmailInputGroup setIsEmailValid={setIsEmailValid} setEmailInput={setEmailInput} />
        <CtaButton isLoading={isLoading} onPress={onPress} size='s' title={localized_strings.signUpCta} disabled={isNextDisabled} />
      </div>
    </div>
  )
}

function WaitlistThanks({ onNext }: PageProp) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: 400,
      marginTop: 'auto',
      marginBottom: 'auto',
    }}>
      <WaitlistSignupTitle />
      <div style={{
        padding: 40,
        display: 'flex',
        gap: 40,
        marginTop: 20,
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        backgroundColor: 'rgba(60,60,60,0.2)',
        borderRadius: numbers.CTA_BUTTON_BORDER_RADIUS,
      }}>

        <p
          style={{
            alignSelf: 'center',
            color: 'white',
            fontSize: 30,
            fontStyle: 'italic',
            margin: 0,
          }}
        >{localized_strings.thanks}</p>
        <CtaButton onPress={onNext} size='s' title={localized_strings.backHomeCta} />
      </div>
    </div>
  )
}

interface PageProp {
  onNext: () => void
}


const signUpStateMapper: EnumDictionary<SignUpState, React.ElementType<PageProp>> = {
  [SignUpState.HOME]: Home,
  [SignUpState.FORM]: WaitlistForm,
  [SignUpState.THANKS]: WaitlistThanks,
}

const nextStateMapper: EnumDictionary<SignUpState, SignUpState> = {
  [SignUpState.HOME]: SignUpState.FORM,
  [SignUpState.FORM]: SignUpState.THANKS,
  [SignUpState.THANKS]: SignUpState.HOME,
}

function App() {
  const [signUpState, setSignupState] = useState(SignUpState.HOME)
  const DisplayComponent = signUpStateMapper[signUpState]
  const onNext = useCallback(() => {
    setSignupState(nextStateMapper[signUpState])
  }, [signUpState])
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      height: '100vh',
      alignItems: 'center',
    }}>
      <DisplayComponent onNext={onNext} />
      <BackgroundFill />
    </div >)
}

function BackgroundFill() {
  return (
    <svg style={{
      zIndex: ZIndices.BackgroundFill,
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      top: 0,
    }} viewBox="0 0 1512 982" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1512" height="982" fill="url(#paint0_linear_9_3)" />
      <defs>
        <linearGradient id="paint0_linear_9_3" x1="1136" y1="-112.5" x2="90" y2="803.5" gradientUnits="userSpaceOnUse">
          <stop offset="0.0870987" stopColor="#150B1D" />
          <stop offset="1" />
        </linearGradient>
      </defs>
    </svg>
  )
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);