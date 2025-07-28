/** This is a glorified css file */
import React from "react";
import styled, {keyframes} from "styled-components"
import { ERROR_BACKGROUND_COLOR, ERROR_MARGIN_COLOR, HINT_BACKGROUND_COLOR, HINT_MARGIN_COLOR, ORDER_STATUS, WARNING_BACKGROUND_COLOR, WARNING_MARGIN_COLOR } from "~/lib/constants";

export const rotation = {
  cw : {
    deg90 : keyframes`
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(90deg);
    }
  `
  },
  ccw : {
    deg90 : keyframes`
    from {
      transform: rotate(90deg);
    }
    to {
      transform: rotate(0deg);
    }
  `}
};


export const JUSTIFY : {
  between : React.CSSProperties,
  center : React.CSSProperties,
  left : React.CSSProperties
} = {
  between : {
    display : "flex",
    justifyContent : 'space-between'
  },
  center : {
    display : "flex",
    justifyContent : 'center',
  },
  left : {
    display : "flex",
    justifyContent : "left"
  }
};

export const DISPLAY : {
  INLINE_BLOCK : React.CSSProperties,
  FLEX : React.CSSProperties
} = {
  INLINE_BLOCK : { display : 'inline-block'},
  FLEX : { display : "flex" }
};

export const CENTER : React.CSSProperties = {
  alignItems: 'center',
  textAlign: 'center'
};

export const MARGIN = {
  all : {
    px0 : {
      margin : '0px'
    },
  },
  bottom : {
    px30 : {
      marginBottom : '30px'
    },
  },
  topBottom : {
    px50 : {
      marginTop : '50px',
      marginBottom : '50px',
    },
    px15 : {
      marginTop: '15px',
      marginBottom: '15px',
    },
    px0 : {
      marginTop: '0px',
      marginBottom: '0px',
    }
  },
  leftRight : {
    px15 : {
      marginLeft: '15px',
      marginRight: '15px',
    },
    px50 : {
      marginLeft: '50px',
      marginRight: '50px',
    }
  },
}

export const PADDING = {
  all : {
    px0 : { padding : "0px" },
    px25 : { padding : "25px"},
  }
}

export const FONT = {
  light : {
    fontFamily: "marilight, Helvetica Neue, Helvetica, Arial, sans-serif",
  },
  book : {
    fontFamily : "MariBook, Helvetica Neue, Helvetica, Arial, sans-serif"
  },
  bold : {
    fontFamily: "maribold, Helvetica Neue, Helvetica, Arial, sans-serif",
  },
  heavy : {
    fontFamily: "mariHeavy, Helvetica Neue, Helvetica, Arial, sans-serif"
  },
  poster : {
    fontFamily : "MariPoster, Helvetica Neue, Helvetica, Arial, sans-serif"
  },
}

export const FONT_SIZE = {
  em1p5 : {
    fontSize : "1.5em"
  },
  em1p25 : {
    fontSize : "1.25em"
  },
}

export const PADDING_TOP_BOTTOM_0PX = {
  paddingTop: '0px',
  paddingBottom: '0px'
};

export const NAVBAR_STYLES = {
  navbarElement : {
    color : 'white' ,
    width : '150px',
    padding : '10px',
    marginRight: '15px',
    marginLeft: '15px',
    border : '1px',
    borderStyle: 'solid',
    borderRadius: '10px',
    fontFamily: "mariheavy, Helvetica Neue, Helvetica, Arial, sans-serif",
  },
  navbarMargin : {
    marginBottom: '20px',
  },
  mainIcon : {
    maxHeight : 'min(100%, 62.5px)',
    maxWidth : '100%'
  }
};

export const HIGH_CONTRAST_ORDER_COLORS = {
  [ORDER_STATUS.ORDERED] : "#FFD4D4",
  [ORDER_STATUS.CANCELLED] : "#CCCCCC",
  [ORDER_STATUS.ACCEPTED] : "#FFFAD4",
  [ORDER_STATUS.RELEASED] : "#D3FFD8",
};
export const cssCenter : React.CSSProperties = {
  display: "block",
  margin: 'auto',
  alignItems: 'center',
  textAlign: 'center'
};

export const ERROR_CONTAINER_CSS: React.CSSProperties = {
  borderStyle: 'solid',
  borderColor: 'black',
  borderLeft: '2px',
  borderRight: '2px',
  borderTop: '0px',
  borderBottom: '0px',
  minHeight: '100vh',
  boxShadow: '3px 3px 6px 6px #888888',
};

export const cssAlignRight : React.CSSProperties = {
  justifyContent: 'right',
  display: 'flex'
};

export const cssError : React.CSSProperties = {
  background: ERROR_BACKGROUND_COLOR,
  borderColor: ERROR_MARGIN_COLOR,
};

export const cssWarningColor : React.CSSProperties = {
  background: WARNING_BACKGROUND_COLOR,
  borderColor: WARNING_MARGIN_COLOR
};

export const cssHintColor : React.CSSProperties = {
  background: HINT_BACKGROUND_COLOR,
  borderColor: HINT_MARGIN_COLOR
};


export const cssTableCenter : React.CSSProperties = {
  textAlign: "center",
  verticalAlign: "middle",
};

export const marginLess : React.CSSProperties = {
  margin: "0px"
};
