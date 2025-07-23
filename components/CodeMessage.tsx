import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {oneDark} from "react-syntax-highlighter/dist/cjs/styles/prism";
export default function CodeMessage = ({code, language}: {code: string, language: string}) => {
    <SyntaxHighlighter language={language} style={oneDark}>
        {code}
    </SyntaxHighlighter>
}

