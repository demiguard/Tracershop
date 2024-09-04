/** This is a glorified css file */
import styled, {keyframes} from "styled-components"

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

export const JUSTIFY = {
  between : {
    display : "flex",
    justifyContent : 'space-between'
  },
};

export const FLEX = {
  display : "flex"
};

export const CENTER = {
  alignItems: 'center',
  textAlign: 'center'
};

export const MARGIN = {
  all : {
    px0 : {
      margin : '0px'
    },
  },
  topBottom : {
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
    px0 : { padding : "0px" }
  }
}

export const  FONT = {
  light : {
    fontFamily: "marilight, Helvetica Neue, Helvetica, Arial, sans-serif",
  },
  bold : {
    fontFamily: "maribold, Helvetica Neue, Helvetica, Arial, sans-serif",
  },
  heavy : {
    fontFamily: "mariHeavy, Helvetica Neue, Helvetica, Arial, sans-serif"
  }
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
