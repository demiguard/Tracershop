import React, {Component} from 'react'
import { Button } from 'react-bootstrap'
import styles from '../../css/Site.module.css'

export {MarginButton, CloseButton}

class MarginButton extends Component {
  render() {
    const props = {...this.props}

    if ("className" in props){
      props["className"] += ` ${styles.Margin15lr}`;
    } else {
      props["className"] = styles.Margin15lr;
    }

    return (<Button {...props}>{props.children}</Button>)
  }
}

class CloseButton extends Component {
  render(){
    return <MarginButton {...this.props}>Luk</MarginButton>
  }
}
