import React, { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'
import { ZIndices } from './ZIndices';
import { localized_strings } from './strings';
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

enum SignUpState {
  HOME,
  FORM,
  THANKS
}


function TitleBanner() {
  return (
    <div style={styles.titleBannerContainer}>
      <p style={{
        ...styles.subtitleText, ...styles.titleBannerSubtitle
      }}
      >{localized_strings.welcomeTo}</p>
      <p style={styles.titleText}
      >{localized_strings.VotoTitle}</p>
    </div>

  )
}



interface CtaButtonProps {
  title: string
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void,
}

function CtaButton({ title, onPress, disabled, isLoading }: CtaButtonProps) {

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

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        ...styles.ctaButton,
        transform: `scale(${scale})`,
        opacity: disabled ? 0.8 : opacity,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >{isLoading ? <SpinnerCicle /> : title}
    </button>
  )

}


interface ExplainerTextProps {
  text: string
}
function ExplainerText({ text }: ExplainerTextProps) {
  return <p style={styles.explainerText} >{text}</p>
}


export function Home({ onNext }: PageProp) {
  return (
    <div style={styles.homePageContainer}>
      <TitleBanner />
      <ExplainerText text={localized_strings.explainer} />
      <CtaButton onPress={onNext} title={localized_strings.waitlistCta} />
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


  return (<div style={{ ...styles.columnContainer, gap: '0.05rem' }}>
    <p style={styles.mediumRegularText} >{localized_strings.emailAsk}</p>
    <div style={styles.rowContainer}>
      <input
        spellCheck={false}
        onChange={onChange}
        autoComplete='email'
        placeholder={localized_strings.emailPlaceholder}
        style={{ ...styles.textInput, alignSelf: 'center' }}
        type='email' />
      <StatusIndicator status={emailStatus} />
    </div>
  </div>)
}




function WaitlistSignupTitle() {
  return (<p style={styles.containerTitle} >{localized_strings.waitlistSignupTitle}</p>)
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
    <div style={styles.middleModalOuterContainer}>
      <WaitlistSignupTitle />
      <div style={{
        ...styles.middleModalInnerContainer,
        gap: 30
      }}>

        <EmailInputGroup setIsEmailValid={setIsEmailValid} setEmailInput={setEmailInput} />
        <CtaButton isLoading={isLoading} onPress={onPress} title={localized_strings.signUpCta} disabled={isNextDisabled} />
      </div>
    </div>
  )
}


function WaitlistThanks({ onNext }: PageProp) {
  return (
    <div style={styles.middleModalOuterContainer}>
      <WaitlistSignupTitle />
      <div style={{ ...styles.middleModalInnerContainer, gap: 40, }}>

        <p
          style={{ alignSelf: 'center', ...styles.mediumItalicText }}
        >{localized_strings.thanks}</p>
        <CtaButton onPress={onNext} title={localized_strings.backHomeCta} />
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
    <div style={styles.appContainer}>
      <DisplayComponent onNext={onNext} />
      <BackgroundFill />
    </div >)
}

function BackgroundFill() {
  return (
    <div
      style={{
        ...styles.absoluteFill,
        zIndex: ZIndices.BackgroundFill,
      }}
    >
      <svg

        width="100%"
        height="100%"
        style={{
          position: 'absolute'
        }} fill="none" xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100%" height="100%" fill="url(#paint0_linear_9_3)" />
        <defs>
          <linearGradient id="paint0_linear_9_3" x1="1136" y1="-112.5" x2="90" y2="803.5" gradientUnits="userSpaceOnUse">
            <stop offset="0.0870987" stopColor="#150B1D" />
            <stop offset="1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


var stylesShared = {
  borderRadius: 5,
  fontFamily: "Crimson Pro"
}

var styles: { [key: string]: CSSProperties } = {
  columnContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  rowContainer: {
    display: 'flex',
    flexDirection: 'row'
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    height: '100vh',
    alignItems: 'center',
  },
  middleModalOuterContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: "0.8rem",
    marginTop: 'auto',
    marginBottom: 'auto',

  },
  middleModalInnerContainer: {
    padding: '0.04rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    marginTop: 20,
    backgroundColor: 'rgba(60,60,60,0.2)',
    borderRadius: stylesShared.borderRadius,
  },
  titleBannerContainer: {
    display: "flex",
    alignSelf: 'center',
    flexDirection: 'column',
    userSelect: 'none',
  },
  titleBannerSubtitle: {
    marginBottom: "-1em",
  },
  homePageContainer: {
    height: '70%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginLeft: 10,
    marginRight: 10,
    marginBottom: "0.08rem",
  },
  containerTitle: {
    fontSize: '0.08rem',
    userSelect: 'none',
    margin: 0,
    color: 'white'
  },
  explainerText: {
    fontSize: '0.05rem',
    userSelect: 'none',
    color: 'white',
  },
  mediumRegularText: {
    color: 'white',
    fontSize: '0.05rem',
    margin: 0,
  },
  mediumItalicText: {
    color: 'white',
    fontSize: '0.05rem',
    fontStyle: 'italic',
    margin: 0,
  },
  textInput: {
    outline: 0,
    border: 0,
    color: 'white',
    borderRadius: stylesShared.borderRadius,
    fontFamily: stylesShared.fontFamily,
    height: "0.08rem",
    width: '20%',
    flex: 1,
    paddingLeft: '0.02rem',
    paddingRight: '0.02rem',
    fontSize: '0.05rem',
    backgroundColor: 'rgba(255,255,255,0.25)'
  },
  subtitleText: {
    color: "white",
    margin: 0,
    fontStyle: "italic",
    fontWeight: 400,
    fontSize: '0.05rem',
  },
  titleText: {
    color: "white",
    margin: 0,
    fontSize: "0.2rem",
  },
  ctaButton: {
    margin: 0,
    color: 'black',
    fontSize: '0.05rem',
    height: '0.08rem',
    backgroundColor: 'white',
    fontFamily: stylesShared.fontFamily,
    border: 0,
    width: '100%',
    borderRadius: stylesShared.borderRadius,
  },
}