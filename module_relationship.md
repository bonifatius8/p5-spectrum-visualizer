# モジュール連関図

```mermaid
graph LR
    B(setup);
    C(draw);
    D[dataHolder.ts];
    E[dataProcessing.ts];
    F[ellipse.ts];
    G[concentricCircles.t];
    H[spectrumAnalyzer.ts];
    I(AudioContext);
    J(設定パラメータ);
    K[spectrumAnalyzerClass.ts]
    L[drawProcessing.ts]
    M[drawMainCanvas.ts]

    B ==> C
    C ==> E
    E ==> L
    L ==> M

    B --> I
    B --> J

    E --> D
    D --> E

    E -.- I

    L -.- J
    M -.- J

    L --> F
    L --> G
    %% L --> K
    K --> H

    D -.- F
    D -.- G
    %% D -.- K


    subgraph sketch.ts
        setup
        draw

    end

    subgraph setup
        B
        I
        J
    end

    subgraph draw
        C
        D
        E
        L
        M
    end

    subgraph 描画モジュール
        F
        G
    end


```

-   dataHolder: アプリケーション全体で使用されるデータを一元的に管理し、データの永続化を担当します。具体的には、AudioContext、設定パラメータ、FFT データなどを管理します。
-   dataProcessing: dataHolder からデータを受け取り、描画モジュールが使用できる形式に変換する役割を担います。具体的には、スペクトラムデータの平滑化、正規化、A 特性補正などを行います。

※関数オブジェクトを使用する。クラスは用いない
